import { Context } from 'hono';
import { VerifyAccountBody } from './schema';
import { validateRequiredFields } from '../../../helpers/validation';
import { normalizeKenyaPhone } from '../../../utils/phone';
import { r2Connector } from '../../../connectors/r2';
import { analyzeDocumentsWithGemini } from '../../../connectors/gemini';
import { nativeFirestore } from '../../../connectors/firestore';
import { User } from '../../../schema/user';
import { VerificationRecord, KycDocuments } from '../../../schema/verification';
import { zeptomailConnector } from '../../../connectors/zeptomail';

export async function handleVerifyAccount(c: Context) {
  const user = c.get('user') as User;
  const body: VerifyAccountBody = await c.req.json();

  const reqErr = validateRequiredFields(body, ['nationalIdFile', 'studentIdFile', 'parentIdFile', 'birthCertificateFile', 'passportPhotoFile', 'fullPhotoFile', 'parentPhone']);
  if (reqErr) return c.json({ success: false, error: reqErr }, 400);

  const phoneRes = normalizeKenyaPhone(body.parentPhone);
  if (!phoneRes.valid) return c.json({ success: false, error: `Invalid parent phone: ${phoneRes.error}` }, 400);

  // Cross-account antifraud: Student cannot use own phone as parent
  if (phoneRes.phone === user.phone) {
    return c.json({ success: false, error: 'Self-parenting violation: Student cannot use their own phone number as parent phone.', code: 'SELF_PARENTING_PHONE' }, 400);
  }

  // Cross-account peer collusion: Parent phone must not belong to another registered student
  const allUsersSnap = await nativeFirestore.collection<User>('users').get();
  const allUsers = allUsersSnap.docs.map((d) => d.data());
  const peerStudent = allUsers.find((u) => u.type === 'student' && u.phone === phoneRes.phone && u.id !== user.id);
  if (peerStudent) {
    return c.json({ success: false, error: `Peer collusion detected: Parent phone ${phoneRes.phone} belongs to another registered student (${peerStudent.fullName}).`, code: 'PEER_COLLUSION_PHONE' }, 400);
  }

  const [natId, stuId, parId, birthCert, passPhoto, fullPhoto] = await Promise.all([
    r2Connector.uploadFile(body.nationalIdFile, `${user.id}_national_id.jpg`),
    r2Connector.uploadFile(body.studentIdFile, `${user.id}_student_id.jpg`),
    r2Connector.uploadFile(body.parentIdFile, `${user.id}_parent_id.jpg`),
    r2Connector.uploadFile(body.birthCertificateFile, `${user.id}_birth_cert.jpg`),
    r2Connector.uploadFile(body.passportPhotoFile, `${user.id}_passport_photo.jpg`),
    r2Connector.uploadFile(body.fullPhotoFile, `${user.id}_full_photo.jpg`),
  ]);

  const documents: KycDocuments = {
    nationalIdUrl: natId.url, studentIdUrl: stuId.url, parentIdUrl: parId.url,
    birthCertificateUrl: birthCert.url, passportPhotoUrl: passPhoto.url, fullPhotoUrl: fullPhoto.url,
  };

  const geminiResult = await analyzeDocumentsWithGemini(user.fullName, documents);
  const detectedNatId = body.nationalIdNumber?.trim() || geminiResult.extractedNationalIdNumber?.trim();
  const detectedParId = body.parentIdNumber?.trim() || geminiResult.extractedParentIdNumber?.trim();

  // 1 account per National ID rule
  if (detectedNatId) {
    const existingIdUser = allUsers.find((u) => u.id !== user.id && u.nationalIdNumber && u.nationalIdNumber.trim() === detectedNatId);
    if (existingIdUser) {
      return c.json({ success: false, error: `National ID ${detectedNatId} is already registered to another account (${existingIdUser.id}). 1 account per ID rule.`, code: 'DUPLICATE_NATIONAL_ID' }, 409);
    }
  }

  // Parent ID cannot be another registered student's National ID
  if (detectedParId) {
    const peerWithId = allUsers.find((u) => u.type === 'student' && u.nationalIdNumber && u.nationalIdNumber.trim() === detectedParId);
    if (peerWithId) {
      return c.json({ success: false, error: `Peer forgery detected: Parent ID ${detectedParId} is registered as student ${peerWithId.fullName}.`, code: 'PEER_FORGERY_PARENT_ID' }, 409);
    }
  }

  const nextStatus = geminiResult.passed ? 'pending_admin_approval' : 'ai_rejected';
  const verificationRecord: VerificationRecord = {
    id: `ver_${Date.now()}`, userId: user.id, documents, parentPhone: phoneRes.phone,
    nationalIdNumber: detectedNatId, parentIdNumber: detectedParId,
    geminiResult, status: nextStatus, createdAt: Date.now(),
  };

  await Promise.all([
    (await nativeFirestore.collection<VerificationRecord>('verifications').doc(verificationRecord.id)).set(verificationRecord),
    (await nativeFirestore.collection<User>('users').doc(user.id)).update({
      status: nextStatus, parentPhone: phoneRes.phone,
      nationalIdNumber: detectedNatId || user.nationalIdNumber, updatedAt: Date.now(),
    }),
  ]);

  const subject = geminiResult.passed ? 'Compinance: Documents Verified by AI' : 'Compinance: Verification Rejected - Antifraud Flag';
  const emailMsg = geminiResult.passed
    ? `<p>Dear ${user.fullName},</p><p>Documents passed automated AI antifraud checks. Awaiting compliance approval.</p>`
    : `<p>Dear ${user.fullName},</p><p>Verification rejected due to forensic inconsistency: ${geminiResult.reasons.join(', ')}.</p>`;
  zeptomailConnector.sendEmail({ toEmail: user.email, toName: user.fullName, subject, htmlContent: emailMsg }).catch(() => {});

  return c.json({
    success: geminiResult.passed,
    message: geminiResult.passed ? 'AI Antifraud checks passed. Pending admin approval.' : `Verification rejected: ${geminiResult.reasons.join(', ')}`,
    data: { status: nextStatus, geminiResult, verificationId: verificationRecord.id },
  });
}
