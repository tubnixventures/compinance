import { Context } from 'hono';
import { ResetPasswordBody } from './schema';
import { validateRequiredFields } from '../../../helpers/validation';
import { nativeFirestore } from '../../../connectors/firestore';
import { OtpRecord } from '../../../schema/common';
import { User } from '../../../schema/user';
import { hashPassword } from '../../../utils/crypto';

export async function handleResetPassword(c: Context) {
  const body: ResetPasswordBody = await c.req.json();
  const reqErr = validateRequiredFields(body, ['email', 'code', 'newPassword']);
  if (reqErr) return c.json({ success: false, error: reqErr }, 400);

  if (body.newPassword.length < 6) {
    return c.json({ success: false, error: 'Password must be at least 6 characters' }, 400);
  }

  const cleanEmail = body.email.toLowerCase().trim();
  const otpRef = nativeFirestore.collection<OtpRecord>('otps');
  const snap = await otpRef.get();
  const now = Date.now();

  const otpDoc = snap.docs
    .map((d) => d.data())
    .filter((o) => o.target === cleanEmail && o.purpose === 'forgot_password' && !o.verified && o.expiresAt > now)
    .sort((a, b) => b.createdAt - a.createdAt)[0];

  if (!otpDoc || otpDoc.code !== body.code.trim()) {
    return c.json({ success: false, error: 'Invalid or expired reset code' }, 400);
  }

  // Find user
  const usersRef = nativeFirestore.collection<User>('users');
  const userSnap = await usersRef.get();
  const user = userSnap.docs.find((d) => d.data().email.toLowerCase() === cleanEmail);
  if (!user) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }

  const newHash = await hashPassword(body.newPassword);
  await (await usersRef.doc(user.id)).update({ passwordHash: newHash, updatedAt: Date.now() });
  await (await otpRef.doc(otpDoc.id)).update({ verified: true });

  return c.json({ success: true, message: 'Password has been successfully updated. You may now login.' });
}
