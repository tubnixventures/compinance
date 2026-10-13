import { Context } from 'hono';
import { ForgotPasswordBody } from './schema';
import { isValidEmail } from '../../../helpers/validation';
import { nativeFirestore } from '../../../connectors/firestore';
import { User } from '../../../schema/user';
import { OtpRecord } from '../../../schema/common';
import { generateOtpCode, generateNanoId } from '../../../utils/crypto';
import { zeptomailConnector } from '../../../connectors/zeptomail';

export async function handleForgotPassword(c: Context) {
  const body: ForgotPasswordBody = await c.req.json();
  if (!body.email || !isValidEmail(body.email)) {
    return c.json({ success: false, error: 'Valid email is required' }, 400);
  }

  const cleanEmail = body.email.toLowerCase().trim();
  const usersRef = nativeFirestore.collection<User>('users');
  const snap = await usersRef.get();
  const user = snap.docs.find((d) => d.data().email.toLowerCase() === cleanEmail);

  if (!user) {
    // Return friendly generic response for security
    return c.json({ success: true, message: 'If an account exists, a password reset OTP was dispatched.' });
  }

  const otp = generateOtpCode(6);
  const otpId = `otp_${generateNanoId(10)}`;

  await (await nativeFirestore.collection<OtpRecord>('otps').doc(otpId)).set({
    id: otpId,
    target: cleanEmail,
    code: otp,
    purpose: 'forgot_password',
    expiresAt: Date.now() + 15 * 60 * 1000,
    attempts: 0,
    verified: false,
    createdAt: Date.now(),
  });

  await zeptomailConnector.sendEmail({
    toEmail: cleanEmail,
    toName: user.data().fullName,
    subject: 'Compinance Password Reset Code',
    htmlContent: `<p>Use reset code <strong>${otp}</strong> to set a new password. Valid for 15 minutes.</p>`,
  });

  return c.json({ success: true, message: 'Password reset OTP dispatched to email.' });
}
