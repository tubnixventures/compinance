import { Context } from 'hono';
import { OtpVerifyBody } from './schema';
import { nativeFirestore } from '../../../connectors/firestore';
import { OtpRecord } from '../../../schema/common';
import { User } from '../../../schema/user';
import { createAccessToken, createRefreshToken } from '../../../utils/jwt';
import { buildAuthCookieHeaders } from '../../../utils/cookies';
import { isWebRequest } from '../../../utils/client-detector';

export async function handleOtpVerify(c: Context) {
  const body: OtpVerifyBody = await c.req.json();
  const cleanEmail = body.email?.toLowerCase().trim();
  const cleanCode = body.code?.trim();

  if (!cleanEmail || !cleanCode) {
    return c.json({ success: false, error: 'Email and OTP code required' }, 400);
  }

  const otpRef = nativeFirestore.collection<OtpRecord>('otps');
  const snap = await otpRef.get();
  const now = Date.now();

  const matched = snap.docs
    .map((d) => d.data())
    .filter((o) => o.target === cleanEmail && !o.verified && o.expiresAt > now)
    .sort((a, b) => b.createdAt - a.createdAt)[0];

  if (!matched) {
    return c.json({ success: false, error: 'Invalid or expired OTP code' }, 400);
  }

  if (matched.code !== cleanCode) {
    await (await otpRef.doc(matched.id)).update({ attempts: matched.attempts + 1 });
    return c.json({ success: false, error: 'Incorrect OTP code' }, 400);
  }

  // Mark verified in Firestore
  await (await otpRef.doc(matched.id)).update({ verified: true });

  const usersRef = nativeFirestore.collection<User>('users');
  const userSnap = await usersRef.get();
  const userDoc = userSnap.docs.find((d) => d.data().email.toLowerCase() === cleanEmail);
  if (!userDoc) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }

  const user = userDoc.data();
  const accessToken = createAccessToken(user.id, user.role, user.type);
  const refreshToken = createRefreshToken(user.id, user.role, user.type);

  if (isWebRequest(c)) {
    const cookies = buildAuthCookieHeaders(accessToken, refreshToken);
    cookies.forEach((cookie) => c.header('Set-Cookie', cookie, { append: true }));
  }

  return c.json({
    success: true,
    message: 'OTP verified successfully',
    data: {
      user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone, status: user.status },
      tokens: { accessToken, refreshToken, expiresIn: 3600, refreshExpiresIn: 60 * 24 * 3600 },
    },
  });
}
