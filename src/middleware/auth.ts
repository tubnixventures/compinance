import { Context, Next } from 'hono';
import { parseCookies } from '../utils/cookies';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { nativeFirestore } from '../connectors/firestore';
import { User } from '../schema/user';

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('authorization');
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    const cookies = parseCookies(c.req.header('cookie'));
    token = cookies['token'];
  }

  if (!token) {
    return c.json({ success: false, error: 'Unauthorized: missing access token', code: 'UNAUTHORIZED' }, 401);
  }

  const payload = verifyToken(token, false);
  if (!payload || payload.tokenType !== 'access') {
    return c.json({ success: false, error: 'Unauthorized: invalid or expired token', code: 'TOKEN_EXPIRED' }, 401);
  }

  // Load user
  const userDoc = await nativeFirestore.collection<User>('users').doc(payload.sub);
  const snap = await userDoc.get();
  if (!snap.exists) {
    return c.json({ success: false, error: 'User account not found', code: 'USER_NOT_FOUND' }, 401);
  }

  c.set('user', snap.data());
  c.set('jwt', payload);
  await next();
}
