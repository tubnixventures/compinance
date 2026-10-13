import { Context } from 'hono';
import { ApproveAccountBody } from './schema';
import { User } from '../../../schema/user';
import { canApproveAccount } from '../../../helpers/hierarchy';
import { nativeFirestore } from '../../../connectors/firestore';
import { zeptomailConnector } from '../../../connectors/zeptomail';
import { infobipConnector } from '../../../connectors/infobip';

export async function handleApproveAccount(c: Context) {
  const staff = c.get('user') as User;
  const body: ApproveAccountBody = await c.req.json();

  if (!body.userId) {
    return c.json({ success: false, error: 'Student userId is required' }, 400);
  }

  // Only roles above customer care (manager, admin, ceo, root) or with canVerifyKYC duty
  if (!canApproveAccount(staff.role, staff.duties)) {
    return c.json(
      {
        success: false,
        error: 'Forbidden: Only roles above customer care (Manager, Admin, CEO, Root) can approve accounts',
        code: 'INSUFFICIENT_HIERARCHY',
      },
      403
    );
  }

  const userDoc = await nativeFirestore.collection<User>('users').doc(body.userId);
  const snap = await userDoc.get();
  if (!snap.exists) return c.json({ success: false, error: 'Student account not found' }, 404);

  const student = snap.data();
  const nextStatus = body.approved ? 'approved' : 'rejected';

  const initialLimit = student.loanLimit || 30; // First-time loan is always KES 30

  await userDoc.update({
    status: nextStatus,
    loanLimit: body.approved ? initialLimit : student.loanLimit,
    isDefaulter: student.isDefaulter || false,
    updatedAt: Date.now(),
  });

  // Automated notification to student
  const subject = body.approved ? 'Compinance: Account Approved!' : 'Compinance: Account Verification Update';
  const htmlContent = body.approved
    ? `<p>Dear ${student.fullName},</p><p>Congratulations! Your Compinance account has been approved by our risk & compliance team. You can now apply for emergency student loans.</p>`
    : `<p>Dear ${student.fullName},</p><p>Your account verification was declined. Reason: ${body.notes || 'Document verification could not be validated'}.</p>`;

  Promise.all([
    zeptomailConnector.sendEmail({ toEmail: student.email, toName: student.fullName, subject, htmlContent }),
    infobipConnector.sendWhatsAppMessage({
      toPhone: student.phone,
      message: body.approved
        ? `Congratulations ${student.fullName}! Your Compinance student loan account is now APPROVED. Log in to submit loan requests.`
        : `Your Compinance verification was not approved. Please contact support.`,
      userOptedIn: student.whatsappOptIn,
    }),
  ]).catch(() => {});

  return c.json({
    success: true,
    message: `Account status updated to '${nextStatus}' by ${staff.role} (${staff.fullName})`,
    data: { userId: student.id, status: nextStatus, reviewedByStaffId: staff.id },
  });
}
