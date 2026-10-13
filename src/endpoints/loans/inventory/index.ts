import { Context } from 'hono';
import { Loan } from '../../../schema/loan';
import { User } from '../../../schema/user';
import { pawapayConnector } from '../../../connectors/pawapay';
import { nativeFirestore } from '../../../connectors/firestore';
import { getRoleLevel } from '../../../helpers/hierarchy';

export async function handleGetLoanInventory(c: Context) {
  const caller = c.get('user') as User;
  if (!caller.role || getRoleLevel(caller.role) < 1) {
    return c.json({ success: false, error: 'Staff access required for loan portfolio inventory' }, 403);
  }

  const loansSnap = await nativeFirestore.collection<Loan>('loans').get();
  const loans = loansSnap.docs.map((d) => d.data());
  const now = Date.now();

  let totalDisbursedKes = 0;
  let totalCollectedKes = 0;
  let totalOutstandingKes = 0;
  let defaultedCount = 0;
  let activeCount = 0;

  loans.forEach((l) => {
    if (['disbursed', 'active', 'repaid', 'defaulted'].includes(l.status)) {
      totalDisbursedKes += l.amount;
      totalCollectedKes += l.amountPaid;
      const unpaid = Math.max(0, l.totalPayable - l.amountPaid);
      totalOutstandingKes += unpaid;

      if (l.status === 'defaulted' || (l.dueDate < now && unpaid > 0)) {
        defaultedCount++;
      } else if (l.status === 'disbursed' || l.status === 'active') {
        activeCount++;
      }
    }
  });

  const totalClosedOrActive = activeCount + defaultedCount;
  const defaultRatePercent = totalClosedOrActive > 0 ? Number(((defaultedCount / totalClosedOrActive) * 100).toFixed(2)) : 0;
  const floatInfo = await pawapayConnector.getFloatBalance();

  return c.json({
    success: true,
    data: {
      totalDisbursedKes,
      totalCollectedKes,
      totalOutstandingKes,
      activeCount,
      defaultedCount,
      defaultRatePercent,
      companyFloatBalanceKes: floatInfo.balance,
      companyReserveFloorKes: Number(process.env.COMPANY_FLOAT_MIN_RESERVE_KES || 50000),
      asOf: now,
    },
  });
}
