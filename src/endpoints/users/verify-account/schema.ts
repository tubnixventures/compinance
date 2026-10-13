export interface VerifyAccountBody {
  nationalIdFile: string; // Base64 or URL
  studentIdFile: string;
  parentIdFile: string;
  birthCertificateFile: string;
  passportPhotoFile: string;
  fullPhotoFile: string;
  parentPhone: string;
  nationalIdNumber?: string;
  parentIdNumber?: string;
}
