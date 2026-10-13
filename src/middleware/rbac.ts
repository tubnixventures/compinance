import { Context, Next } from 'hono';
import { User } from '../schema/user';
import { Role } from '../schema/roles';
import { getRoleLevel } from '../helpers/hierarchy';

export function requireStaffRole(minRole?: Role) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as User | undefined;
    if (!user || user.type !== 'staff' || !user.role) {
      return c.json({ success: false, error: 'Forbidden: Staff access only', code: 'STAFF_REQUIRED' }, 403);
    }

    if (minRole && getRoleLevel(user.role) < getRoleLevel(minRole)) {
      return c.json({ success: false, error: `Forbidden: Requires minimum role of ${minRole}`, code: 'ROLE_TOO_LOW' }, 403);
    }

    // Customer care cannot create/write documents without explicit duties
    if (user.role === 'customer_care' && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(c.req.method)) {
      const allowedPaths = ['/api/staff/challenge-parent'];
      if (!allowedPaths.includes(c.req.path)) {
        return c.json(
          {
            success: false,
            error: 'Customer care has read-only permissions and cannot create or modify documents without assigned duty',
            code: 'READ_ONLY_ROLE',
          },
          403
        );
      }
    }

    await next();
  };
}
