import { Context } from 'hono';
import { RepayLoanBody } from './schema';
import { User } from '../../../schema/user';
import { Loan } from '../../../schema/loan';
import { pawapayConnector } from '../../../connectors/pawapay';
import { nativeFirestore } from '../../../connectors/firestore';

export async function handleRepayLoan(c: Context) {
  const user = c.get('user') as User;
  const body: RepayLoanBody = await c.req.json();

  if (!body.loanId || !body.amount) {
    return c.json({ success: false, error: 'loanId and amount are required' }, 400);
  }

  const loanDoc = await nativeFirestore.collection<Loan>('loans').doc(body.loanId);
  const snap = await loanDoc.get();
  if (!snap.exists) return c.json({ success: false, error: 'Loan not found' }, 404);

  const loan = snap.data();
  // Authorization check
  if (user.type === 'student' && loan.userId !== user.id) {
    return c.json({ success: false, error: 'Cannot pay for another student loan' }, 403);
  }

  const amount = Number(body.amount);
  const remaining = loan.totalPayable - loan.amountPaid;
  if (amount <= 0 || amount > remaining) {
    return c.json({ success: false, error: `Invalid payment amount. Remaining balance is KES ${remaining}` }, 400);
  }

  const depositId = `dep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Initiate PawaPay STK push deposit request to student phone
  await pawapayConnector.initiateDeposit({
    depositId,
    amount,
    phone: loan.studentPhone,
  });

  await loanDoc.update({
    pawapayDepositId: depositId,
    updatedAt: Date.now(),
  });

  return c.json({
    success: true,
    message: `PawaPay M-Pesa repayment STK push prompted to ${loan.studentPhone} for KES ${amount.toLocaleString()}`,
    data: { depositId, loanId: loan.id, amount, studentPhone: loan.studentPhone },
  });
}
