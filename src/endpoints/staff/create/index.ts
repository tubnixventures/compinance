import { Context } from 'hono';
import { CreateStaffBody } from './schema';
import { User } from '../../../schema/user';
import { validateRequiredFields, isValidEmail } from '../../../helpers/validation';
import { normalizeKenyaPhone } from '../../../utils/phone';
import { hashPassword, generateNanoId } from '../../../utils/crypto';
import { canCreateStaff } from '../../../helpers/hierarchy';
import { nativeFirestore } from '../../../connectors/firestore';

export async function handleCreateStaff(c: Context) {
  const caller = c.get('user') as User;
  const body: CreateStaffBody = await c.req.json();

  const reqErr = validateRequiredFields(body, ['fullName', 'email', 'phone', 'role']);
  if (reqErr) return c.json({ success: false, error: reqErr }, 400);

  if (!isValidEmail(body.email)) return c.json({ success: false, error: 'Invalid email' }, 400);
  const phoneRes = normalizeKenyaPhone(body.phone);
  if (!phoneRes.valid) return c.json({ success: false, error: phoneRes.error }, 400);

  if (!caller.role) {
    return c.json({ success: false, error: 'Unauthorized: Staff credentials required.' }, 403);
  }

  // Count existing active CEOs in institution
  const usersRef = nativeFirestore.collection<User>('users');
  const snap = await usersRef.get();
  const existingCeos = snap.docs.filter((d) => d.data().type === 'staff' && d.data().role === 'ceo');

  // Governance check: only CEO and Root create staff; CEO created by Root; 1 CEO max; CEO cannot create Manager
  const check = canCreateStaff(caller.role, body.role, existingCeos.length);
  if (!check.allowed) {
    return c.json({ success: false, error: check.reason, code: 'GOVERNANCE_VIOLATION' }, 403);
  }

  const staffId = `stf_${generateNanoId(10)}`;
  const passwordHash = await hashPassword(body.password || 'Compinance2026!');

  const newStaff: User = {
    id: staffId,
    fullName: body.fullName.trim(),
    email: body.email.toLowerCase().trim(),
    phone: phoneRes.phone,
    passwordHash,
    type: 'staff',
    role: body.role,
    duties: body.duties || {},
    whatsappOptIn: false,
    status: 'approved',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await (await usersRef.doc(staffId)).set(newStaff);

  return c.json({
    success: true,
    message: `Staff member ${newStaff.fullName} successfully provisioned as ${newStaff.role} by ${caller.role}`,
    data: { id: newStaff.id, fullName: newStaff.fullName, email: newStaff.email, role: newStaff.role, duties: newStaff.duties },
  }, 201);
}
