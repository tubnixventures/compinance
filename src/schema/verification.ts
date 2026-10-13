export interface KycDocuments {
  nationalIdUrl: string;
  studentIdUrl: string;
  parentIdUrl: string;
  birthCertificateUrl: string;
  passportPhotoUrl: string;
  fullPhotoUrl: string;
}

export interface GeminiVerificationResult {
  passed: boolean;
  forgeryDetected: boolean;
  namesMatch: boolean;
  faceMatchScore: number; // 0.0 - 1.0 (biometric match between student selfie and student ID)
  isParentStudentOrPeer: boolean; // Flagged true if parent document is student ID or peer colleague
  isSelfParentingDetected: boolean; // Flagged true if student used own face/ID as parent
  ageGapPlausible: boolean; // Parent must be plausibly older (>= 18 years older than student)
  digitalTamperingDetected: boolean; // Digital artifacts, mismatched fonts, cloned pixels
  lineageMatch: boolean; // Parent ID name matches parent listed on Birth Certificate
  extractedNationalIdNumber?: string;
  extractedParentIdNumber?: string;
  reasons: string[];
  analyzedAt: number;
}

export interface VerificationRecord {
  id: string;
  userId: string;
  documents: KycDocuments;
  parentPhone: string;
  nationalIdNumber?: string;
  parentIdNumber?: string;
  parentOtpSentAt?: number;
  parentOtpVerified?: boolean;
  geminiResult?: GeminiVerificationResult;
  status: 'pending_ai' | 'ai_rejected' | 'pending_admin_approval' | 'approved' | 'rejected';
  adminNotes?: string;
  reviewedByStaffId?: string;
  reviewedAt?: number;
  createdAt: number;
}
