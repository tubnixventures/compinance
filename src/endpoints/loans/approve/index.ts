import { Context } from 'hono';
import { ApproveLoanBody } from './schema';
import { User } from '../../../schema/user';
import { Loan } from '../../../schema/loan';
import { canApproveLoan } from '../../../helpers/hierarchy';
import { isFloatAdequate } from '../../../helpers/loan-calculator';
import { pawapayConnector } from '../../../connectors/pawapay';
import { nativeFirestore } from '../../../connectors/firestore';
import { zeptomailConnector } from '../../../connectors/zeptomail';
import { infobipConnector } from '../../../connectors/infobip';

export async function handleApproveLoan(c: Context) {
  const staff = c.get('user') as User;
  const body: ApproveLoanBody = await c.req.json();

  if (!canApproveLoan(staff.role, staff.duties)) {
    return c.json({ success: false, error: 'Forbidden: Insufficient privileges to approve loans' }, 403);
  }

  const loanDoc = await nativeFirestore.collection<Loan>('loans').doc(body.loanId);
  const snap = await loanDoc.get();
  if (!snap.exists) return c.json({ success: false, error: 'Loan not found' }, 404);

  const loan = snap.data();
  if (loan.status !== 'requested') {
    return c.json({ success: false, error: `Loan is currently in '${loan.status}' status, cannot approve.` }, 400);
  }

  // CRITICAL: First check balance from our company account to avoid approving empty loans
  const floatInfo = await pawapayConnector.getFloatBalance();
  const minReserve = Number(process.env.COMPANY_FLOAT_MIN_RESERVE_KES || 50000);
  const floatCheck = isFloatAdequate(floatInfo.balance, loan.amount, minReserve);

  if (!floatCheck.adequate) {
    return c.json(
      {
        success: false,
        error: `Company PawaPay float insufficient (KES ${floatInfo.balance.toLocaleString()}). Required: KES ${loan.amount} + min reserve KES ${minReserve}. Shortfall: KES ${floatCheck.shortfall}. Float top-up needed before approval.`,
        code: 'INSUFFICIENT_COMPANY_FLOAT',
        data: { currentFloat: floatInfo.balance, minReserve, requestedAmount: loan.amount },
      },
      422
    );
  }

  // Initiate PawaPay Mobile Money Payout (Disbursement to M-Pesa)
  const payoutRes = await pawapayConnector.initiatePayout({
    payoutId: `payout_${loan.id}_${Date.now()}`,
    amount: loan.amount,
    phone: loan.studentPhone,
    recipientName: loan.studentName,
  });

  const now = Date.now();
  await loanDoc.update({
    status: 'disbursed',
    approvedByStaffId: staff.id,
    approvedAt: now,
    disbursedAt: now,
    pawapayPayoutId: payoutRes.payoutId,
    updatedAt: now,
  });

  // Automated notification to student
  const studentDoc = await nativeFirestore.collection<User>('users').doc(loan.userId);
  const studentSnap = await studentDoc.get();
  const student = studentSnap.data();

  if (student) {
    Promise.all([
      zeptomailConnector.sendEmail({
        toEmail: student.email,
        toName: student.fullName,
        subject: `Compinance: Loan Approved & Disbursed (KES ${loan.amount.toLocaleString()})`,
        htmlContent: `<p>Hello ${student.fullName},</p><p>Your emergency loan of <strong>KES ${loan.amount.toLocaleString()}</strong> has been approved by ${staff.fullName} and disbursed to your M-Pesa phone ${loan.studentPhone}.</p><p>Total payable on or before due date: <strong>KES ${loan.totalPayable.toLocaleString()}</strong>.</p>`,
      }),
      infobipConnector.sendWhatsAppMessage({
        toPhone: student.phone,
        message: `Compinance Alert: KES ${loan.amount.toLocaleString()} has been approved and sent to your M-Pesa! Due date: ${new Date(loan.dueDate).toLocaleDateString()}. Total: KES ${loan.totalPayable.toLocaleString()}.`,
        userOptedIn: student.whatsappOptIn,
      }),
    ]).catch(() => {});
  }

  return c.json({
    success: true,
    message: `Loan approved and disbursed via PawaPay M-Pesa. Float verified: KES ${floatInfo.balance.toLocaleString()}.`,
    data: { loanId: loan.id, amount: loan.amount, status: 'disbursed', payoutId: payoutRes.payoutId },
  });
}
