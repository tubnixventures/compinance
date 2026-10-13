import { Context, Next } from 'hono';
import { nativeFirestore } from '../connectors/firestore';
import { AuditLog } from '../schema/audit';
import { extractGeo } from './geo-fencing';
import { User } from '../schema/user';

export async function auditLoggerMiddleware(c: Context, next: Next) {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;

  const geo = extractGeo(c);
  const user = c.get('user') as User | undefined;
  const status = c.res.status < 400 ? 'SUCCESS' : 'FAILED';

  const auditEntry: AuditLog = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    actorId: user?.id,
    actorRole: user?.role,
    action: `${c.req.method} ${c.req.path}`,
    resource: c.req.path.split('/')[2] || 'root',
    ip: geo.ip,
    country: geo.country,
    region: geo.region,
    status,
    metadata: {
      durationMs: duration,
      httpStatus: c.res.status,
    },
  };

  nativeFirestore.collection<AuditLog>('audit_logs').add(auditEntry).catch(() => {});
}
