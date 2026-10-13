import { Context } from 'hono';
import { User } from '../../../schema/user';
import { canViewStaff } from '../../../helpers/hierarchy';
import { nativeFirestore } from '../../../connectors/firestore';

export async function handleListStaff(c: Context) {
  const caller = c.get('user') as User;
  if (caller.type !== 'staff' || !caller.role) {
    return c.json({ success: false, error: 'Staff access required' }, 403);
  }

  const snap = await nativeFirestore.collection<User>('users').get();
  const allStaff = snap.docs.map((d) => d.data()).filter((u) => u.type === 'staff' && u.role);

  // Hierarchy visibility rule: you cannot see same level!
  // Target role must be strictly lower than caller role (Root sees all)
  const visibleStaff = allStaff.filter((target) => {
    if (caller.id === target.id) return true; // caller can always see self
    return canViewStaff(caller.role!, target.role!);
  });

  const sanitized = visibleStaff.map((s) => ({
    id: s.id,
    fullName: s.fullName,
    email: s.email,
    phone: s.phone,
    role: s.role,
    duties: s.duties,
    createdAt: s.createdAt,
    lastLoginAt: s.lastLoginAt,
  }));

  return c.json({
    success: true,
    callerRole: caller.role,
    count: sanitized.length,
    data: sanitized,
  });
}
