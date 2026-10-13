import { Context } from 'hono';
import { ParentChallengeBody } from './schema';
import { nativeFirestore } from '../../../connectors/firestore';
import { User } from '../../../schema/user';
import { OtpRecord } from '../../../schema/common';
import { generateOtpCode, generateNanoId } from '../../../utils/crypto';
import { infobipConnector } from '../../../connectors/infobip';

export async function handleParentChallenge(c: Context) {
  const staff = c.get('user') as User;
  const body: ParentChallengeBody = await c.req.json();

  if (!body.userId) {
    return c.json({ success: false, error: 'Student userId is required' }, 400);
  }

  const userDoc = await nativeFirestore.collection<User>('users').doc(body.userId);
  const snap = await userDoc.get();
  if (!snap.exists) return c.json({ success: false, error: 'Student account not found' }, 404);

  const student = snap.data();
  if (!student.parentPhone) {
    return c.json({ success: false, error: 'Student does not have a parent phone number registered' }, 400);
  }

  const otpCode = generateOtpCode(6);
  const otpId = `otp_${generateNanoId(10)}`;

  await (await nativeFirestore.collection<OtpRecord>('otps').doc(otpId)).set({
    id: otpId,
    target: student.parentPhone,
    code: otpCode,
    purpose: 'parent_challenge',
    expiresAt: Date.now() + 15 * 60 * 1000,
    attempts: 0,
    verified: false,
    createdAt: Date.now(),
  });

  // Dispatch OTP challenge to parent phone
  await infobipConnector.sendWhatsAppMessage({
    toPhone: student.parentPhone,
    message: `Compinance Security: Your student ${student.fullName} has submitted loan documents. Your parent confirmation OTP code is: ${otpCode}. Valid for 15 mins.`,
    userOptedIn: true,
  });

  return c.json({
    success: true,
    message: `Challenge OTP triggered to parent phone ${student.parentPhone} by staff ${staff.fullName}`,
    data: { parentPhone: student.parentPhone, challengedByStaffId: staff.id },
  });
}
