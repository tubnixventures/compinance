import { Role, StaffDuties } from './roles';

export type UserType = 'student' | 'staff';
export type VerificationStatus =
  | 'unverified'
  | 'pending_ai'
  | 'ai_rejected'
  | 'pending_admin_approval'
  | 'approved'
  | 'rejected';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string; // M-Pesa format (+254...) Unique 1 account per phone
  nationalIdNumber?: string; // Kenya National ID number (Unique: 1 account per ID)
  passwordHash?: string;
  type: UserType;
  role?: Role; // only if type === 'staff'
  duties?: StaffDuties;
  whatsappOptIn: boolean;
  status: VerificationStatus;
  loanLimit?: number; // Qualified borrowing limit in KES (First-time default KES 30)
  isDefaulter?: boolean; // Flagged true when any loan is defaulted/unsettled
  totalLoansCompleted?: number; // Total successfully repaid loans
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number;
  parentPhone?: string;
  parentOtpVerified?: boolean;
}
