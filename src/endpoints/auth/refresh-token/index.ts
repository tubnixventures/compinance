import { Context } from 'hono';
import { RefreshTokenBody } from './schema';
import { parseCookies } from '../../../utils/cookies';
import { verifyToken, createAccessToken, createRefreshToken } from '../../../utils/jwt';
import { buildAuthCookieHeaders } from '../../../utils/cookies';
import { isWebRequest } from '../../../utils/client-detector';
import { nativeFirestore } from '../../../connectors/firestore';
import { User } from '../../../schema/user';

export async function handleRefreshToken(c: Context) {
  let token: string | undefined;

  try {
    const body: RefreshTokenBody = await c.req.json().catch(() => ({}));
    token = body.refreshToken;
  } catch {}

  if (!token) {
    const cookies = parseCookies(c.req.header('cookie'));
    token = cookies['refresh_token'];
  }

  if (!token) {
    return c.json({ success: false, error: 'Refresh token required' }, 401);
  }

  const payload = verifyToken(token, true);
  if (!payload || payload.tokenType !== 'refresh') {
    return c.json({ success: false, error: 'Invalid or expired 60-day refresh token' }, 401);
  }

  const userDoc = await nativeFirestore.collection<User>('users').doc(payload.sub);
  const snap = await userDoc.get();
  if (!snap.exists) {
    return c.json({ success: false, error: 'User not found' }, 401);
  }

  const user = snap.data();
  const newAccessToken = createAccessToken(user.id, user.role, user.type);
  const newRefreshToken = createRefreshToken(user.id, user.role, user.type);

  if (isWebRequest(c)) {
    const cookies = buildAuthCookieHeaders(newAccessToken, newRefreshToken);
    cookies.forEach((cookie) => c.header('Set-Cookie', cookie, { append: true }));
  }

  return c.json({
    success: true,
    message: 'Tokens refreshed successfully',
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 3600,
      refreshExpiresIn: 60 * 24 * 3600,
    },
  });
}
