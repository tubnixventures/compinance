import { Context } from 'hono';

/**
 * Server-side determination of Web vs Native Mobile client.
 * Never trusts frontend body parameters.
 * Inspects standard HTTP headers: Origin, Sec-Fetch-Mode, Referer, and User-Agent.
 */
export function isWebRequest(c: Context): boolean {
  const req = c.req;
  const origin = req.header('origin');
  const secFetch = req.header('sec-fetch-mode') || req.header('sec-fetch-dest');
  const referer = req.header('referer');
  const userAgent = (req.header('user-agent') || '').toLowerCase();

  if (origin || secFetch || referer) {
    return true;
  }

  // Detect standard browser user agents
  const isBrowser =
    userAgent.includes('mozilla') ||
    userAgent.includes('chrome') ||
    userAgent.includes('safari') ||
    userAgent.includes('firefox') ||
    userAgent.includes('edge');

  const isNativeMobile =
    userAgent.includes('okhttp') ||
    userAgent.includes('cfnetwork') ||
    userAgent.includes('dart') ||
    userAgent.includes('flutter') ||
    userAgent.includes('expo');

  return isBrowser && !isNativeMobile;
}
