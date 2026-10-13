import { Context, Next } from 'hono';
import { logger } from '../utils/logger';
import { nativeFirestore } from '../connectors/firestore';
import { GeoLocation } from '../schema/audit';

export function extractGeo(c: Context): GeoLocation {
  const req = c.req;
  const ip =
    req.header('cf-connecting-ip') ||
    req.header('x-forwarded-for')?.split(',')[0].trim() ||
    req.header('x-real-ip') ||
    '102.217.156.1'; // Nairobi KE fallback in local environments

  const country =
    req.header('cf-ipcountry') ||
    req.header('x-country-code') ||
    (ip.startsWith('102.') || ip.startsWith('196.') ? 'KE' : 'KE');

  const region = req.header('cf-region') || req.header('x-region') || 'Nairobi County';
  const isVpnOrProxy = req.header('cf-ray') ? false : Boolean(req.header('via') || req.header('proxy-connection'));

  return { ip, country: country.toUpperCase(), region, isVpnOrProxy };
}

export async function geoFencingMiddleware(c: Context, next: Next) {
  const path = c.req.path;
  // Expose docs and health check unconditionally
  if (path.startsWith('/doc') || path === '/health' || path === '/') {
    return next();
  }

  const geo = extractGeo(c);
  const enforce = (process.env.ENFORCE_KENYA_GEO || 'false').toLowerCase() === 'true';

  if (enforce) {
    if (!geo.ip || !geo.country || !geo.region || geo.isVpnOrProxy) {
      logger.security('Blocked request with anonymized IP / VPN proxy', { path, ...geo });
      return c.json({ success: false, error: 'Access forbidden: Anonymized IP / VPN proxy detected', code: 'VPN_BLOCKED' }, 403);
    }
    if (geo.country !== 'KE') {
      logger.security('Blocked request originating outside Kenya', { path, ...geo });
      return c.json({ success: false, error: 'Access forbidden: Compinance operates exclusively within Kenya', code: 'GEO_BLOCKED' }, 403);
    }
  }

  c.set('geo', geo);
  await next();
}
