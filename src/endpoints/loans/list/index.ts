import { Context } from 'hono';
import { User } from '../../../schema/user';
import { Loan } from '../../../schema/loan';
import { nativeFirestore } from '../../../connectors/firestore';

export async function handleListLoans(c: Context) {
  const caller = c.get('user') as User;
  const statusFilter = c.req.query('status');

  const loansSnap = await nativeFirestore.collection<Loan>('loans').get();
  let loans = loansSnap.docs.map((d) => d.data());

  // Students can only see their own loans
  if (caller.type === 'student') {
    loans = loans.filter((l) => l.userId === caller.id);
  } else {
    const studentIdFilter = c.req.query('userId');
    if (studentIdFilter) {
      loans = loans.filter((l) => l.userId === studentIdFilter);
    }
  }

  if (statusFilter) {
    loans = loans.filter((l) => l.status === statusFilter);
  }

  loans.sort((a, b) => b.createdAt - a.createdAt);

  return c.json({
    success: true,
    count: loans.length,
    data: loans,
  });
}
