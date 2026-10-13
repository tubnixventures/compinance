import { Context } from 'hono';
import { SignupBody } from './schema';
import { validateRequiredFields, isValidEmail } from '../../../helpers/validation';
import { normalizeKenyaPhone } from '../../../utils/phone';
import { hashPassword, generateNanoId } from '../../../utils/crypto';
import { createAccessToken, createRefreshToken } from '../../../utils/jwt';
import { buildAuthCookieHeaders } from '../../../utils/cookies';
import { isWebRequest } from '../../../utils/client-detector';
import { nativeFirestore } from '../../../connectors/firestore';
import { User } from '../../../schema/user';
import { zeptomailConnector } from '../../../connectors/zeptomail';
import { infobipConnector } from '../../../connectors/infobip';

export async function handleSignup(c: Context) {
  const body: SignupBody = await c.req.json();
  const reqErr = validateRequiredFields(body, ['fullName', 'email', 'phone']);
  if (reqErr) return c.json({ success: false, error: reqErr }, 400);

  if (!isValidEmail(body.email)) return c.json({ success: false, error: 'Invalid official email address' }, 400);

  const phoneRes = normalizeKenyaPhone(body.phone);
  if (!phoneRes.valid) return c.json({ success: false, error: phoneRes.error }, 400);

  // Strict Policy: 1 account per Phone number and 1 account per National ID
  const usersRef = nativeFirestore.collection<User>('users');
  const allUsersSnap = await usersRef.get();
  const allUsers = allUsersSnap.docs.map((d) => d.data());

  if (allUsers.some((u) => u.phone === phoneRes.phone)) {
    return c.json({ success: false, error: `Phone number ${phoneRes.phone} is already registered. Limit is 1 account per phone.`, code: 'DUPLICATE_PHONE' }, 409);
  }
  if (allUsers.some((u) => u.email.toLowerCase() === body.email.toLowerCase().trim())) {
    return c.json({ success: false, error: 'Email address is already in use by another account.', code: 'DUPLICATE_EMAIL' }, 409);
  }
  const cleanId = body.nationalIdNumber?.trim();
  if (cleanId && allUsers.some((u) => u.nationalIdNumber && u.nationalIdNumber.trim() === cleanId)) {
    return c.json({ success: false, error: `National ID ${cleanId} is already registered. Limit is 1 account per ID.`, code: 'DUPLICATE_NATIONAL_ID' }, 409);
  }

  const userId = `usr_${generateNanoId(12)}`;
  const passwordHash = body.password ? await hashPassword(body.password) : undefined;
  const whatsappOptIn = Boolean(body.whatsapp);

  const newUser: User = {
    id: userId,
    fullName: body.fullName.trim(),
    email: body.email.toLowerCase().trim(),
    phone: phoneRes.phone,
    nationalIdNumber: cleanId,
    passwordHash,
    type: 'student',
    whatsappOptIn,
    status: 'unverified',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await (await usersRef.doc(userId)).set(newUser);

  const accessToken = createAccessToken(userId, undefined, 'student');
  const refreshToken = createRefreshToken(userId, undefined, 'student');

  Promise.all([
    zeptomailConnector.sendEmail({
      toEmail: newUser.email,
      toName: newUser.fullName,
      subject: 'Welcome to Compinance Student Loans',
      htmlContent: `<p>Hello ${newUser.fullName},</p><p>Account registered. Proceed to KYC to upload verification documents.</p>`,
    }),
    infobipConnector.sendWhatsAppMessage({
      toPhone: newUser.phone,
      message: `Welcome to Compinance, ${newUser.fullName}! Complete verification for micro-credit.`,
      userOptedIn: whatsappOptIn,
    }),
  ]).catch(() => {});

  if (isWebRequest(c)) {
    const cookies = buildAuthCookieHeaders(accessToken, refreshToken);
    cookies.forEach((cookie) => c.header('Set-Cookie', cookie, { append: true }));
  }

  return c.json({
    success: true,
    message: 'Student account created successfully. Please complete KYC verification.',
    data: { user: { id: newUser.id, fullName: newUser.fullName, email: newUser.email, phone: newUser.phone, nationalIdNumber: newUser.nationalIdNumber, status: newUser.status }, tokens: { accessToken, refreshToken, expiresIn: 3600 } },
  }, 201);
}
