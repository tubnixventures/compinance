import { Context } from 'hono';
import { ApplyLoanBody } from './schema';
import { User } from '../../../schema/user';
import { Loan } from '../../../schema/loan';
import { calculateLoanTerms, DEFAULT_FIRST_TIME_LOAN, MIN_LOAN_AMOUNT } from '../../../helpers/loan-calculator';
import { generateNanoId } from '../../../utils/crypto';
import { nativeFirestore } from '../../../connectors/firestore';

export async function handleApplyLoan(c: Context) {
  const user = c.get('user') as User;
  const body: ApplyLoanBody = await c.req.json();

  if (user.status !== 'approved') {
    return c.json({ success: false, error: 'Verified and approved account required to apply for loans.', code: 'NOT_APPROVED' }, 403);
  }

  // Defaulter verification
  if (user.isDefaulter) {
    return c.json({ success: false, error: 'Account is flagged as a defaulter. Unsettled loans must be resolved first.', code: 'DEFAULTER_FLAGGED' }, 403);
  }

  const amount = Number(body.amount);
  const duration = Number(body.duration) || 14;

  if (isNaN(amount) || amount < MIN_LOAN_AMOUNT) {
    return c.json({ success: false, error: `Minimum loan amount is KES ${MIN_LOAN_AMOUNT}.` }, 400);
  }

  // Check previous loans history: You can ONLY apply after full repayment of previous loans!
  const loansSnap = await nativeFirestore.collection<Loan>('loans').get();
  const userLoans = loansSnap.docs.map((d) => d.data()).filter((l) => l.userId === user.id);
  const unpaidLoan = userLoans.find((l) => l.status !== 'repaid');

  if (unpaidLoan) {
    return c.json({
      success: false,
      error: `You can only apply for a new loan after full repayment of previous loans. Outstanding loan ${unpaidLoan.id} is in status '${unpaidLoan.status}'.`,
      code: 'UNSETTLED_PREVIOUS_LOAN',
    }, 409);
  }

  // Qualification check: First-time borrowers default to KES 30 (range 20-50 max) unless manually adjusted
  const isFirstTime = userLoans.length === 0;
  const qualifiedLimit = user.loanLimit ?? (isFirstTime ? DEFAULT_FIRST_TIME_LOAN : DEFAULT_FIRST_TIME_LOAN);

  if (amount > qualifiedLimit) {
    return c.json({
      success: false,
      error: `Requested amount KES ${amount} exceeds your allocated credit limit of KES ${qualifiedLimit}. You can only apply for loans you qualify for.`,
      code: 'EXCEEDS_QUALIFIED_LIMIT',
      data: { requestedAmount: amount, qualifiedLimit, isFirstTimeBorrower: isFirstTime },
    }, 422);
  }

  const { interest, totalPayable, dueDate } = calculateLoanTerms(amount, duration);
  const loanId = `ln_${generateNanoId(10)}`;

  const newLoan: Loan = {
    id: loanId,
    userId: user.id,
    studentName: user.fullName,
    studentPhone: user.phone,
    amount,
    interestRate: 0.08,
    totalPayable,
    durationDays: duration,
    dueDate,
    status: 'requested',
    amountPaid: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await (await nativeFirestore.collection<Loan>('loans').doc(loanId)).set(newLoan);

  return c.json({
    success: true,
    message: `Loan application for KES ${amount} submitted successfully. Qualified limit: KES ${qualifiedLimit}.`,
    data: newLoan,
  }, 201);
}
