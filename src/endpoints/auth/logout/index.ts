import { Context } from 'hono';
import { buildClearCookieHeaders } from '../../../utils/cookies';

export async function handleLogout(c: Context) {
  const clearHeaders = buildClearCookieHeaders();
  clearHeaders.forEach((h) => c.header('Set-Cookie', h, { append: true }));

  return c.json({
    success: true,
    message: 'Logged out successfully. Session cookies cleared.',
  });
}
