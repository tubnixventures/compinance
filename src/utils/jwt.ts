import crypto from 'crypto';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'compinance_access_secret_2026_dev_key';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'compinance_refresh_secret_2026_dev_key';

export const ACCESS_TOKEN_TTL_SEC = 3600; // 1 hour
export const REFRESH_TOKEN_TTL_SEC = 60 * 24 * 3600; // 60 days

export interface JwtPayload {
  sub: string; // userId
  role?: string;
  type: 'student' | 'staff';
  exp: number;
  iat: number;
  tokenType: 'access' | 'refresh';
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64').toString('utf8');
}

export function createAccessToken(userId: string, role?: string, type: 'student' | 'staff' = 'student'): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub: userId,
    role,
    type,
    iat: now,
    exp: now + ACCESS_TOKEN_TTL_SEC,
    tokenType: 'access',
  };
  return signToken(payload, ACCESS_SECRET);
}

export function createRefreshToken(userId: string, role?: string, type: 'student' | 'staff' = 'student'): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub: userId,
    role,
    type,
    iat: now,
    exp: now + REFRESH_TOKEN_TTL_SEC,
    tokenType: 'refresh',
  };
  return signToken(payload, REFRESH_SECRET);
}

function signToken(payload: JwtPayload, secret: string): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token: string, isRefresh: boolean = false): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const secret = isRefresh ? REFRESH_SECRET : ACCESS_SECRET;
    const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    if (sig !== expectedSig) return null;
    const payload: JwtPayload = JSON.parse(base64UrlDecode(body));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}
