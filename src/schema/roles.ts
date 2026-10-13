export type Role = 'customer_care' | 'manager' | 'admin' | 'ceo' | 'root';

export const ROLE_HIERARCHY: Record<Role, number> = {
  customer_care: 1,
  manager: 2,
  admin: 3,
  ceo: 4,
  root: 5,
};

export type StaffPermission =
  | 'approve_loan'
  | 'create_user'
  | 'manage_collections'
  | 'manage_kyc'
  | 'view_financials';

export interface StaffDuties {
  assignedCollector?: boolean;
  canApproveLoans?: boolean;
  canCreateUsers?: boolean;
  canVerifyKYC?: boolean;
}
