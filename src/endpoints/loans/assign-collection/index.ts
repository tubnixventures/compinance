import { Context } from 'hono';
import { AssignCollectionBody } from './schema';
import { User } from '../../../schema/user';
import { Loan } from '../../../schema/loan';
import { nativeFirestore } from '../../../connectors/firestore';
import { canAssignDuties } from '../../../helpers/hierarchy';

export async function handleAssignCollection(c: Context) {
  const caller = c.get('user') as User;
  const body: AssignCollectionBody = await c.req.json();

  if (!canAssignDuties(caller.role)) {
    return c.json({ success: false, error: 'Forbidden: Only CEO or Root can assign collections', code: 'FORBIDDEN' }, 403);
  }

  if (!body.loanId || !body.collectorStaffId) {
    return c.json({ success: false, error: 'loanId and collectorStaffId are required' }, 400);
  }

  const loanDoc = await nativeFirestore.collection<Loan>('loans').doc(body.loanId);
  const snap = await loanDoc.get();
  if (!snap.exists) return c.json({ success: false, error: 'Loan not found' }, 404);

  const loan = snap.data();
  const staffDoc = await nativeFirestore.collection<User>('users').doc(body.collectorStaffId);
  const staffSnap = await staffDoc.get();
  if (!staffSnap.exists) return c.json({ success: false, error: 'Target staff not found' }, 404);

  const collector = staffSnap.data();

  // Atomically mark loan as defaulted and flag borrower as defaulter
  await Promise.all([
    loanDoc.update({
      assignedCollectorId: collector.id,
      assignedByStaffId: caller.id,
      status: 'defaulted',
      updatedAt: Date.now(),
    }),
    (await nativeFirestore.collection<User>('users').doc(loan.userId)).update({
      isDefaulter: true,
      updatedAt: Date.now(),
    }),
  ]);

  return c.json({
    success: true,
    message: `Defaulted loan ${loan.id} assigned to collector ${collector.fullName}. Borrower ${loan.userId} marked as defaulter.`,
    data: { loanId: loan.id, borrowerId: loan.userId, assignedCollectorId: collector.id },
  });
}
