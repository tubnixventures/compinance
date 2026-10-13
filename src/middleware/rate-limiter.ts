import { Context, Next } from 'hono';
import { logger } from '../utils/logger';

interface RateRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateRecord>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 15; // 15 attempts per minute on auth routes

export async function authRateLimiter(c: Context, next: Next) {
  const ip =
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
    '127.0.0.1';

  const key = `ratelimit_${ip}_${c.req.path}`;
  const now = Date.now();
  const existing = rateLimitMap.get(key);

  if (existing && existing.resetAt > now) {
    if (existing.count >= MAX_ATTEMPTS) {
      logger.security('Rate limit exceeded on authentication endpoint', { ip, path: c.req.path });
      return c.json(
        {
          success: false,
          error: 'Too many authentication attempts. Please wait 1 minute before retrying.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        429
      );
    }
    existing.count++;
  } else {
    rateLimitMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
  }

  await next();
}
