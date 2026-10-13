import { Context } from 'hono';
import { VerifyParentOtpBody } from './schema';
import { nativeFirestore } from '../../../connectors/firestore';
import { User } from '../../../schema/user';
import { OtpRecord } from '../../../schema/common';

export async function handleVerifyParentOtp(c: Context) {
  const body: VerifyParentOtpBody = await c.req.json();
  if (!body.userId || !body.code) {
    return c.json({ success: false, error: 'userId and code are required' }, 400);
  }

  const userDoc = await nativeFirestore.collection<User>('users').doc(body.userId);
  const snap = await userDoc.get();
  if (!snap.exists) return c.json({ success: false, error: 'Student not found' }, 404);

  const student = snap.data();
  const parentPhone = student.parentPhone;
  if (!parentPhone) return c.json({ success: false, error: 'No parent phone on file' }, 400);

  const otps = await nativeFirestore.collection<OtpRecord>('otps').get();
  const now = Date.now();
  const matched = otps.docs
    .map((d) => d.data())
    .filter((o) => o.target === parentPhone && o.purpose === 'parent_challenge' && !o.verified && o.expiresAt > now)
    .sort((a, b) => b.createdAt - a.createdAt)[0];

  if (!matched || matched.code !== body.code.trim()) {
    return c.json({ success: false, error: 'Invalid or expired parent challenge code' }, 400);
  }

  await (await nativeFirestore.collection<OtpRecord>('otps').doc(matched.id)).update({ verified: true });
  await userDoc.update({ parentOtpVerified: true, updatedAt: Date.now() });

  return c.json({ success: true, message: 'Parent phone challenge successfully verified.' });
}
