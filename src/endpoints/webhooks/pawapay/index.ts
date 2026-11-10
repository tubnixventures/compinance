import { Context } from 'hono';
import {
  PawaPayDepositWebhookPayload,
  PawaPayPayoutWebhookPayload,
  PawaPayRefundWebhookPayload,
  PawaPayFloatNotificationPayload,
} from './schema';
import { nativeFirestore } from '../../../connectors/firestore';
import { Loan } from '../../../schema/loan';
import { User } from '../../../schema/user';
import { zeptomailConnector } from '../../../connectors/zeptomail';
import { infobipConnector } from '../../../connectors/infobip';
import { logger } from '../../../utils/logger';

// 1. Deposits Webhook: C2B Repayment via M-Pesa STK Push
export async function handlePawaPayDepositWebhook(c: Context) {
  const body: PawaPayDepositWebhookPayload = await c.req.json();
  const eventId = `wh_dep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Store raw webhook payload in Cosmos DB
  await (await nativeFirestore.collection('pawapay_webhooks').doc(eventId)).set({
    id: eventId,
    eventType: 'deposit',
    payload: body,
    status: body.status,
    receivedAt: Date.now(),
  });

  const loansSnap = await nativeFirestore.collection<Loan>('loans').get();
  const payerPhone = body.payer?.address?.value;
  const targetLoan = loansSnap.docs
    .map((d) => d.data())
    .find(
      (l) =>
        (body.depositId && l.pawapayDepositId === body.depositId) ||
        (payerPhone && (l.studentPhone === payerPhone || l.studentPhone === `+${payerPhone}`) && l.status !== 'repaid')
    );

  if (!targetLoan) {
    logger.info(`PawaPay deposit webhook received without matched loan: ${body.depositId}`);
    return c.json({ status: 'ACCEPTED', message: 'Webhook logged. No active loan matched.', depositId: body.depositId });
  }

  const loanRef = await nativeFirestore.collection<Loan>('loans').doc(targetLoan.id);

  if (body.status === 'COMPLETED' && body.amount > 0) {
    const newPaid = Number(targetLoan.amountPaid || 0) + Number(body.amount);
    const isFullyPaid = newPaid >= targetLoan.totalPayable;
    const nextStatus = isFullyPaid ? 'repaid' : 'active';

    await loanRef.update({
      amountPaid: newPaid,
      status: nextStatus,
      repaidAt: isFullyPaid ? Date.now() : targetLoan.repaidAt,
      lastPaymentAt: Date.now(),
      pawapayDepositId: body.depositId,
      updatedAt: Date.now(),
    });

    // Check borrower status and clear defaulter flag if all loans settled
    const userDoc = await nativeFirestore.collection<User>('users').doc(targetLoan.userId);
    const userSnap = await userDoc.get();
    const user = userSnap.data();

    if (user && isFullyPaid) {
      const remainingDefaulters = loansSnap.docs
        .map((d) => d.data())
        .filter((l) => l.userId === user.id && l.id !== targetLoan.id && l.status === 'defaulted');

      const nextLimit = Math.min((user.loanLimit || 30) * 2, 50000);

      await userDoc.update({
        isDefaulter: remainingDefaulters.length > 0,
        totalLoansCompleted: (user.totalLoansCompleted || 0) + 1,
        loanLimit: nextLimit,
        updatedAt: Date.now(),
      });
    }

    if (user) {
      Promise.all([
        zeptomailConnector.sendEmail({
          toEmail: user.email,
          toName: user.fullName,
          subject: isFullyPaid ? 'Compinance: Loan Repayment Complete!' : `Compinance: M-Pesa Payment Received (KES ${body.amount})`,
          htmlContent: `<p>Dear ${user.fullName},</p><p>We received your repayment of <strong>KES ${body.amount.toLocaleString()}</strong> via PawaPay M-Pesa.</p><p>Total Paid: KES ${newPaid.toLocaleString()} / KES ${targetLoan.totalPayable.toLocaleString()}. Loan Status: <strong>${nextStatus.toUpperCase()}</strong>.</p>`,
        }),
        infobipConnector.sendWhatsAppMessage({
          toPhone: user.phone,
          message: `Compinance: Received KES ${body.amount.toLocaleString()} for loan ${targetLoan.id}. Balance: KES ${Math.max(0, targetLoan.totalPayable - newPaid).toLocaleString()}. Status: ${nextStatus}.`,
          userOptedIn: user.whatsappOptIn,
        }),
      ]).catch(() => {});
    }

    logger.info(`PawaPay deposit ${body.depositId} successfully reconciled for loan ${targetLoan.id}`);
  }

  return c.json({ status: 'ACCEPTED', loanId: targetLoan.id, updatedStatus: targetLoan.status });
}

// 2. Payouts Webhook: B2C Loan Disbursement to Student M-Pesa
export async function handlePawaPayPayoutWebhook(c: Context) {
  const body: PawaPayPayoutWebhookPayload = await c.req.json();
  const eventId = `wh_pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  await (await nativeFirestore.collection('pawapay_webhooks').doc(eventId)).set({
    id: eventId,
    eventType: 'payout',
    payload: body,
    status: body.status,
    receivedAt: Date.now(),
  });

  const loansSnap = await nativeFirestore.collection<Loan>('loans').get();
  const targetLoan = loansSnap.docs.map((d) => d.data()).find((l) => l.pawapayPayoutId === body.payoutId);

  if (!targetLoan) {
    return c.json({ status: 'ACCEPTED', message: 'Payout logged without matched loan.' });
  }

  const loanRef = await nativeFirestore.collection<Loan>('loans').doc(targetLoan.id);

  if (body.status === 'COMPLETED') {
    await loanRef.update({
      status: 'disbursed',
      disbursedAt: Date.now(),
      financialTransactionId: body.financialTransactionId,
      updatedAt: Date.now(),
    });
    logger.info(`PawaPay payout ${body.payoutId} completed for loan ${targetLoan.id}`);
  } else if (body.status === 'FAILED') {
    await loanRef.update({
      status: 'requested', // revert for retry or review
      rejectionReason: `Payout failed: ${body.failureReason || 'M-Pesa wallet error'}`,
      updatedAt: Date.now(),
    });
  }

  return c.json({ status: 'ACCEPTED', loanId: targetLoan.id, payoutStatus: body.status });
}

// 3. Refunds Webhook: Payment Reversal & Overpayment Corrections
export async function handlePawaPayRefundWebhook(c: Context) {
  const body: PawaPayRefundWebhookPayload = await c.req.json();
  const eventId = `wh_ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  await (await nativeFirestore.collection('pawapay_webhooks').doc(eventId)).set({
    id: eventId,
    eventType: 'refund',
    payload: body,
    status: body.status,
    receivedAt: Date.now(),
  });

  const loansSnap = await nativeFirestore.collection<Loan>('loans').get();
  const targetLoan = loansSnap.docs.map((d) => d.data()).find((l) => l.pawapayDepositId === body.originalDepositId);

  if (targetLoan && body.status === 'COMPLETED') {
    const loanRef = await nativeFirestore.collection<Loan>('loans').doc(targetLoan.id);
    const adjustedPaid = Math.max(0, targetLoan.amountPaid - body.amount);
    await loanRef.update({
      amountPaid: adjustedPaid,
      status: adjustedPaid < targetLoan.totalPayable ? 'active' : targetLoan.status,
      updatedAt: Date.now(),
    });
  }

  return c.json({ status: 'ACCEPTED', refundId: body.refundId });
}

// 4. Float Notifications Webhook: Liquidity Threshold & Balance Alerts
export async function handlePawaPayFloatWebhook(c: Context) {
  const body: PawaPayFloatNotificationPayload = await c.req.json();
  const eventId = `wh_flt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  await (await nativeFirestore.collection('pawapay_webhooks').doc(eventId)).set({
    id: eventId,
    eventType: 'float_notification',
    payload: body,
    balanceKes: body.balanceKes,
    alertLevel: body.alertLevel,
    receivedAt: Date.now(),
  });

  if (body.alertLevel === 'LOW_BALANCE' || body.alertLevel === 'CRITICAL' || body.balanceKes < (body.minThresholdKes || 50000)) {
    logger.security(`PawaPay Float Alert: Balance ${body.balanceKes} KES below safe reserve floor!`, body);
  }

  return c.json({ status: 'ACCEPTED', notificationId: body.notificationId, currentBalance: body.balanceKes });
}

// History & Webhook Inspector
export async function handleGetPawaPayWebhookHistory(c: Context) {
  const webhooksSnap = await nativeFirestore.collection('pawapay_webhooks').get();
  const history = webhooksSnap.docs.map((d) => d.data()).sort((a, b) => b.receivedAt - a.receivedAt);

  return c.json({
    success: true,
    count: history.length,
    data: history.slice(0, 50),
  });
}
