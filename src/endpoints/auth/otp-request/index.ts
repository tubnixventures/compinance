import { Context } from 'hono';
import { OtpRequestBody } from './schema';
import { isValidEmail } from '../../../helpers/validation';
import { generateOtpCode, generateNanoId } from '../../../utils/crypto';
import { nativeFirestore } from '../../../connectors/firestore';
import { OtpRecord } from '../../../schema/common';
import { User } from '../../../schema/user';
import { zeptomailConnector } from '../../../connectors/zeptomail';

export async function handleOtpRequest(c: Context) {
  const body: OtpRequestBody = await c.req.json();
  if (!body.email || !isValidEmail(body.email)) {
    return c.json({ success: false, error: 'Valid email required' }, 400);
  }

  const cleanEmail = body.email.toLowerCase().trim();
  const purpose = body.purpose || 'login';

  // Check if user exists
  const usersRef = nativeFirestore.collection<User>('users');
  const snap = await usersRef.get();
  const user = snap.docs.find((d) => d.data().email.toLowerCase() === cleanEmail);
  if (!user) {
    return c.json({ success: false, error: 'No Compinance account registered with this email' }, 404);
  }

  const otpCode = generateOtpCode(6);
  const otpId = `otp_${generateNanoId(10)}`;
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Directly written to Firestore - No caching for Fintech app!
  const otpRef = nativeFirestore.collection<OtpRecord>('otps');
  await (await otpRef.doc(otpId)).set({
    id: otpId,
    target: cleanEmail,
    code: otpCode,
    purpose,
    expiresAt,
    attempts: 0,
    verified: false,
    createdAt: Date.now(),
  });

  // Dispatch via ZeptoMail
  await zeptomailConnector.sendEmail({
    toEmail: cleanEmail,
    toName: user.data().fullName,
    subject: `Your Compinance ${purpose === 'login' ? 'Login' : 'Password Reset'} OTP Code`,
    htmlContent: `
      <h2>Compinance Security Verification</h2>
      <p>Your one-time passcode (OTP) is: <strong style="font-size: 24px; color: #10b981;">${otpCode}</strong></p>
      <p>This code is valid for 10 minutes. Never share this code with anyone.</p>
    `,
  });

  return c.json({
    success: true,
    message: `Security OTP sent to ${cleanEmail}`,
    data: { target: cleanEmail, purpose, expiresInSeconds: 600 },
  });
}
