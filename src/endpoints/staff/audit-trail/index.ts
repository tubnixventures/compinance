import { Context } from 'hono';
import { nativeFirestore } from '../../../connectors/firestore';
import { AuditLog } from '../../../schema/audit';
import { User } from '../../../schema/user';
import { getRoleLevel } from '../../../helpers/hierarchy';

export async function handleGetAuditTrail(c: Context) {
  const caller = c.get('user') as User;
  if (!caller.role || getRoleLevel(caller.role) < 2) {
    return c.json({ success: false, error: 'Audit trail requires Manager level or higher' }, 403);
  }

  const staffIdFilter = c.req.query('staffId');
  const limit = Math.min(Number(c.req.query('limit') || 50), 100);

  const logsSnap = await nativeFirestore.collection<AuditLog>('audit_logs').get();
  let logs = logsSnap.docs.map((d) => d.data());

  if (staffIdFilter) {
    logs = logs.filter((l) => l.actorId === staffIdFilter);
  }

  // Sort newest first
  logs.sort((a, b) => b.timestamp - a.timestamp);
  const paged = logs.slice(0, limit);

  return c.json({
    success: true,
    count: paged.length,
    totalRecords: logs.length,
    data: paged,
  });
}
