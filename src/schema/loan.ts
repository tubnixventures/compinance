export type LoanStatus =
  | 'requested'
  | 'float_checked'
  | 'approved'
  | 'disbursed'
  | 'active'
  | 'repaid'
  | 'defaulted';

export interface Loan {
  id: string;
  userId: string;
  studentName: string;
  studentPhone: string;
  amount: number; // KES
  interestRate: number; // e.g. 0.08 (8%)
  totalPayable: number;
  durationDays: number;
  dueDate: number;
  status: LoanStatus;
  approvedByStaffId?: string;
  approvedAt?: number;
  disbursedAt?: number;
  pawapayPayoutId?: string;
  pawapayDepositId?: string;
  amountPaid: number;
  assignedCollectorId?: string;
  assignedByStaffId?: string;
  repaidAt?: number;
  createdAt: number;
  updatedAt: number;
}
