import { Context } from 'hono';
import { PawaPayWebhookPayload } from './schema';
import { nativeFirestore } from '../../../connectors/firestore';
import { Loan } from '../../../schema/loan';
import { User } from '../../../schema/user';
import { zeptomailConnector } from '../../../connectors/zeptomail';
import { infobipConnector } from '../../../connectors/infobip';

export async function handlePawaPayWebhook(c: Context) {
  const body: PawaPayWebhookPayload = await c.req.json();
  const loansSnap = await nativeFirestore.collection<Loan>('loans').get();

  const targetLoan = loansSnap.docs
    .map((d) => d.data())
    .find((l) => (body.depositId && l.pawapayDepositId === body.depositId) || (body.payoutId && l.pawapayPayoutId === body.payoutId));

  if (!targetLoan) {
    return c.json({ success: true, message: 'Webhook received. No corresponding loan record.' });
  }

  const loanRef = await nativeFirestore.collection<Loan>('loans').doc(targetLoan.id);

  if (body.depositId && body.status === 'COMPLETED' && body.amount) {
    const newPaid = targetLoan.amountPaid + body.amount;
    const isFullyPaid = newPaid >= targetLoan.totalPayable;
    const nextStatus = isFullyPaid ? 'repaid' : 'active';

    await loanRef.update({
      amountPaid: newPaid,
      status: nextStatus,
      repaidAt: isFullyPaid ? Date.now() : targetLoan.repaidAt,
      updatedAt: Date.now(),
    });

    const userDoc = await nativeFirestore.collection<User>('users').doc(targetLoan.userId);
    const userSnap = await userDoc.get();
    const user = userSnap.data();

    if (user && isFullyPaid) {
      // Check if user has any remaining defaulted loans
      const remainingLoans = loansSnap.docs
        .map((d) => d.data())
        .filter((l) => l.userId === user.id && l.id !== targetLoan.id && l.status === 'defaulted');

      await userDoc.update({
        isDefaulter: remainingLoans.length > 0,
        totalLoansCompleted: (user.totalLoansCompleted || 0) + 1,
        updatedAt: Date.now(),
      });
    }

    if (user) {
      Promise.all([
        zeptomailConnector.sendEmail({
          toEmail: user.email,
          toName: user.fullName,
          subject: isFullyPaid ? 'Compinance: Loan Fully Repaid!' : `Compinance: Payment Received (KES ${body.amount})`,
          htmlContent: `<p>Dear ${user.fullName},</p><p>We have received KES ${body.amount.toLocaleString()}. Total paid: KES ${newPaid.toLocaleString()} / ${targetLoan.totalPayable.toLocaleString()}. Status: ${nextStatus.toUpperCase()}.</p>`,
        }),
        infobipConnector.sendWhatsAppMessage({
          toPhone: user.phone,
          message: `Compinance: Received KES ${body.amount.toLocaleString()} for loan ${targetLoan.id}. Status: ${nextStatus}.`,
          userOptedIn: user.whatsappOptIn,
        }),
      ]).catch(() => {});
    }
  }

  return c.json({ success: true, message: 'Transaction reconciled successfully', loanId: targetLoan.id });
}
