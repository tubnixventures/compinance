import { Context } from 'hono';
import { User } from '../../../schema/user';
import { nativeFirestore } from '../../../connectors/firestore';
import { VerificationRecord } from '../../../schema/verification';

export async function handleGetProfile(c: Context) {
  const user = c.get('user') as User;

  // Retrieve user verification records if available
  const verifications = await nativeFirestore.collection<VerificationRecord>('verifications').get();
  const kyc = verifications.docs
    .map((d) => d.data())
    .filter((v) => v.userId === user.id)
    .sort((a, b) => b.createdAt - a.createdAt)[0];

  return c.json({
    success: true,
    data: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      type: user.type,
      role: user.role,
      duties: user.duties,
      status: user.status,
      parentPhone: user.parentPhone,
      parentOtpVerified: user.parentOtpVerified,
      whatsappOptIn: user.whatsappOptIn,
      createdAt: user.createdAt,
      kycRecord: kyc || null,
    },
  });
}
