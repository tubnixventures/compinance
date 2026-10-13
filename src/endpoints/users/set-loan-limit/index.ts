import { Context } from 'hono';
import { SetLoanLimitBody } from './schema';
import { User } from '../../../schema/user';
import { canApproveLoan } from '../../../helpers/hierarchy';
import { nativeFirestore } from '../../../connectors/firestore';
import { MIN_LOAN_AMOUNT, MAX_PLATFORM_LOAN } from '../../../helpers/loan-calculator';

export async function handleSetLoanLimit(c: Context) {
  const staff = c.get('user') as User;
  const body: SetLoanLimitBody = await c.req.json();

  if (!canApproveLoan(staff.role, staff.duties)) {
    return c.json(
      {
        success: false,
        error: 'Forbidden: Insufficient privileges to manually allocate loan limits. Manager level or higher required.',
        code: 'INSUFFICIENT_HIERARCHY',
      },
      403
    );
  }

  const limit = Number(body.loanLimit);
  if (!body.userId || isNaN(limit)) {
    return c.json({ success: false, error: 'userId and numeric loanLimit are required' }, 400);
  }

  if (limit < MIN_LOAN_AMOUNT || limit > MAX_PLATFORM_LOAN) {
    return c.json(
      {
        success: false,
        error: `Loan allocation limit must be between KES ${MIN_LOAN_AMOUNT} and KES ${MAX_PLATFORM_LOAN}`,
      },
      400
    );
  }

  const userDoc = await nativeFirestore.collection<User>('users').doc(body.userId);
  const snap = await userDoc.get();
  if (!snap.exists) return c.json({ success: false, error: 'Student account not found' }, 404);

  const student = snap.data();
  if (student.type !== 'student') {
    return c.json({ success: false, error: 'Loan allocation only applies to student borrower accounts' }, 400);
  }

  await userDoc.update({
    loanLimit: limit,
    updatedAt: Date.now(),
  });

  return c.json({
    success: true,
    message: `Loan limit of KES ${limit.toLocaleString()} manually allocated to ${student.fullName} by ${staff.role} (${staff.fullName})`,
    data: {
      userId: student.id,
      studentName: student.fullName,
      loanLimit: limit,
      allocatedByStaffId: staff.id,
      reason: body.reason || 'Staff credit limit review',
    },
  });
}
