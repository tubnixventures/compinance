import { Context } from 'hono';
import { AssignPermissionsBody } from './schema';
import { User } from '../../../schema/user';
import { canAssignDuties } from '../../../helpers/hierarchy';
import { nativeFirestore } from '../../../connectors/firestore';

export async function handleAssignPermissions(c: Context) {
  const caller = c.get('user') as User;
  const body: AssignPermissionsBody = await c.req.json();

  // Only CEO and Root can assign permissions and duties
  if (!canAssignDuties(caller.role)) {
    return c.json(
      {
        success: false,
        error: 'Forbidden: Only CEO and Root can assign special permissions and duties to staff',
        code: 'INSUFFICIENT_EXECUTIVE_RIGHTS',
      },
      403
    );
  }

  if (!body.staffId || !body.duties) {
    return c.json({ success: false, error: 'staffId and duties object are required' }, 400);
  }

  const staffDoc = await nativeFirestore.collection<User>('users').doc(body.staffId);
  const snap = await staffDoc.get();
  if (!snap.exists) return c.json({ success: false, error: 'Target staff not found' }, 404);

  const targetStaff = snap.data();
  const updatedDuties = { ...(targetStaff.duties || {}), ...body.duties };

  await staffDoc.update({ duties: updatedDuties, updatedAt: Date.now() });

  return c.json({
    success: true,
    message: `Special duties updated for ${targetStaff.fullName} (${targetStaff.role}) by ${caller.role}`,
    data: { staffId: targetStaff.id, duties: updatedDuties, assignedBy: caller.id },
  });
}
