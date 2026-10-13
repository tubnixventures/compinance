import { ACCESS_TOKEN_TTL_SEC, REFRESH_TOKEN_TTL_SEC } from './jwt';

export function parseCookies(cookieHeader?: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  const list: Record<string, string> = {};
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts.shift()?.trim();
    if (name) {
      list[name] = decodeURIComponent(parts.join('='));
    }
  });
  return list;
}

export function buildAuthCookieHeaders(
  accessToken: string,
  refreshToken: string,
  isSecure: boolean = process.env.NODE_ENV === 'production'
): string[] {
  const secureFlag = isSecure ? ' Secure;' : '';
  const accessCookie = `token=${accessToken}; Path=/; Max-Age=${ACCESS_TOKEN_TTL_SEC}; HttpOnly; SameSite=Lax;${secureFlag}`;
  const refreshCookie = `refresh_token=${refreshToken}; Path=/; Max-Age=${REFRESH_TOKEN_TTL_SEC}; HttpOnly; SameSite=Lax;${secureFlag}`;
  return [accessCookie, refreshCookie];
}

export function buildClearCookieHeaders(): string[] {
  return [
    'token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax',
    'refresh_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax',
  ];
}
