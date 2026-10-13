import { Context } from 'hono';
import { LoginBody } from './schema';
import { validateRequiredFields } from '../../../helpers/validation';
import { normalizeKenyaPhone } from '../../../utils/phone';
import { verifyPassword } from '../../../utils/crypto';
import { createAccessToken, createRefreshToken } from '../../../utils/jwt';
import { buildAuthCookieHeaders } from '../../../utils/cookies';
import { isWebRequest } from '../../../utils/client-detector';
import { nativeFirestore } from '../../../connectors/firestore';
import { User } from '../../../schema/user';

export async function handleLogin(c: Context) {
  const body: LoginBody = await c.req.json();
  const reqErr = validateRequiredFields(body, ['identifier', 'password']);
  if (reqErr) return c.json({ success: false, error: reqErr }, 400);

  const cleanId = body.identifier.trim().toLowerCase();
  const phoneRes = normalizeKenyaPhone(cleanId);
  const normalizedPhone = phoneRes.valid ? phoneRes.phone : null;

  const usersRef = nativeFirestore.collection<User>('users');
  const snap = await usersRef.get();
  const userDoc = snap.docs.find(
    (d) => d.data().email.toLowerCase() === cleanId || (normalizedPhone && d.data().phone === normalizedPhone)
  );

  if (!userDoc) {
    return c.json({ success: false, error: 'Invalid credentials. User not found.' }, 401);
  }

  const user = userDoc.data();
  if (!user.passwordHash) {
    return c.json({ success: false, error: 'Password not set. Please use passwordless OTP login.' }, 400);
  }

  const valid = await verifyPassword(body.password!, user.passwordHash);
  if (!valid) {
    return c.json({ success: false, error: 'Invalid password' }, 401);
  }

  // Update lastLoginAt
  await (await usersRef.doc(user.id)).update({ lastLoginAt: Date.now() });

  const accessToken = createAccessToken(user.id, user.role, user.type);
  const refreshToken = createRefreshToken(user.id, user.role, user.type);

  if (isWebRequest(c)) {
    const cookies = buildAuthCookieHeaders(accessToken, refreshToken);
    cookies.forEach((cookie) => c.header('Set-Cookie', cookie, { append: true }));
  }

  return c.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        type: user.type,
        role: user.role,
        status: user.status,
      },
      tokens: { accessToken, refreshToken, expiresIn: 3600, refreshExpiresIn: 60 * 24 * 3600 },
    },
  });
}
