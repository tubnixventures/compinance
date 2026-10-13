import { Context } from 'hono';
import { DeleteStaffBody } from './schema';
import { User } from '../../../schema/user';
import { canDeleteStaff } from '../../../helpers/hierarchy';
import { nativeFirestore } from '../../../connectors/firestore';

export async function handleDeleteStaff(c: Context) {
  const caller = c.get('user') as User;
  const body: DeleteStaffBody = await c.req.json();

  if (!caller.role) {
    return c.json({ success: false, error: 'Staff credentials required' }, 403);
  }

  if (!body.staffId) {
    return c.json({ success: false, error: 'staffId is required' }, 400);
  }

  if (caller.id === body.staffId) {
    return c.json({ success: false, error: 'Cannot self-delete account' }, 400);
  }

  const staffDoc = await nativeFirestore.collection<User>('users').doc(body.staffId);
  const snap = await staffDoc.get();
  if (!snap.exists) return c.json({ success: false, error: 'Staff member not found' }, 404);

  const targetStaff = snap.data();
  if (!targetStaff.role) {
    return c.json({ success: false, error: 'Target user is not a staff member' }, 400);
  }

  // Deletion rules: Root can delete anyone including CEO and Manager. CEO cannot delete Manager.
  const check = canDeleteStaff(caller.role, targetStaff.role);
  if (!check.allowed) {
    return c.json({ success: false, error: check.reason, code: 'GOVERNANCE_VIOLATION' }, 403);
  }

  await staffDoc.delete();

  return c.json({
    success: true,
    message: `Staff member ${targetStaff.fullName} (${targetStaff.role}) de-provisioned by ${caller.role}`,
    data: { deletedStaffId: targetStaff.id, role: targetStaff.role },
  });
}
