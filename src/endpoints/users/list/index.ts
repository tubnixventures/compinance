import { Context } from 'hono';
import { User } from '../../../schema/user';
import { canViewStaff } from '../../../helpers/hierarchy';
import { nativeFirestore } from '../../../connectors/firestore';

export async function handleListUsers(c: Context) {
  const caller = c.get('user') as User;
  const typeFilter = c.req.query('type');
  const statusFilter = c.req.query('status');

  const usersSnap = await nativeFirestore.collection<User>('users').get();
  let users = usersSnap.docs.map((d) => d.data());

  if (typeFilter) {
    users = users.filter((u) => u.type === typeFilter);
  }
  if (statusFilter) {
    users = users.filter((u) => u.status === statusFilter);
  }

  // Enforce hierarchy visibility rule: cannot see same level!
  // Students can be seen by all staff. Staff can only be seen if target role level < caller role level (or root).
  users = users.filter((target) => {
    if (target.type === 'student') return true;
    if (caller.role === 'root') return true;
    if (!caller.role || !target.role) return false;
    return canViewStaff(caller.role, target.role);
  });

  const sanitized = users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone,
    type: u.type,
    role: u.role,
    duties: u.duties,
    status: u.status,
    parentPhone: u.parentPhone,
    parentOtpVerified: u.parentOtpVerified,
    createdAt: u.createdAt,
  }));

  return c.json({ success: true, count: sanitized.length, data: sanitized });
}
