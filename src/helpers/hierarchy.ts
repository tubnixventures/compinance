import { Role, ROLE_HIERARCHY, StaffDuties } from '../schema/roles';

export function getRoleLevel(role?: Role): number {
  if (!role) return 0;
  return ROLE_HIERARCHY[role] || 0;
}

export function isStrictlyHigherRole(callerRole: Role, targetRole: Role): boolean {
  return getRoleLevel(callerRole) > getRoleLevel(targetRole);
}

export function canViewStaff(callerRole: Role, targetRole: Role): boolean {
  if (callerRole === 'root') return true;
  return getRoleLevel(callerRole) > getRoleLevel(targetRole);
}

export function canApproveAccount(role?: Role, duties?: StaffDuties): boolean {
  if (!role) return false;
  if (duties?.canVerifyKYC) return true;
  return getRoleLevel(role) >= ROLE_HIERARCHY.manager;
}

export function canApproveLoan(role?: Role, duties?: StaffDuties): boolean {
  if (!role) return false;
  if (duties?.canApproveLoans) return true;
  return getRoleLevel(role) >= ROLE_HIERARCHY.manager;
}

export function canAssignDuties(role?: Role): boolean {
  return role === 'ceo' || role === 'root';
}

/**
 * Microfinance Governance Provisioning Rules:
 * - Only CEO and Root can create company staff.
 * - CEO must be created by Root.
 * - Only 1 CEO allowed across the entire institution.
 * - CEO CANNOT create a manager (only Root creates managers).
 * - Managers, Admins, and Customer Care cannot create any staff.
 */
export function canCreateStaff(
  callerRole: Role,
  targetRole: Role,
  existingCeoCount: number
): { allowed: boolean; reason?: string } {
  if (callerRole !== 'root' && callerRole !== 'ceo') {
    return { allowed: false, reason: 'Only CEO and Root are authorized to create company staff members.' };
  }

  if (targetRole === 'root') {
    return { allowed: false, reason: 'Root accounts cannot be provisioned via API.' };
  }

  if (targetRole === 'ceo') {
    if (callerRole !== 'root') {
      return { allowed: false, reason: 'Only Root can appoint the Chief Executive Officer (CEO).' };
    }
    if (existingCeoCount >= 1) {
      return { allowed: false, reason: 'Microfinance governance violation: Exactly 1 CEO is permitted. Existing CEO must be deleted/demoted first.' };
    }
  }

  if (targetRole === 'manager' && callerRole === 'ceo') {
    return { allowed: false, reason: 'Governance policy: The CEO cannot create or appoint Credit Managers. Credit Managers must be appointed by Root.' };
  }

  return { allowed: true };
}

/**
 * Deletion Rules:
 * - Root has total institution access (can delete anyone, including CEO and Manager).
 * - CEO cannot delete Manager, cannot delete CEO, and cannot delete Root.
 * - CEO can only delete operational staff (Admin, Customer Care).
 * - All other roles have zero deletion rights.
 */
export function canDeleteStaff(callerRole: Role, targetRole: Role): { allowed: boolean; reason?: string } {
  if (callerRole === 'root') return { allowed: true };

  if (callerRole === 'ceo') {
    if (targetRole === 'manager') {
      return { allowed: false, reason: 'Governance policy: The CEO cannot delete Credit Managers. Manager removal requires Root authority.' };
    }
    if (targetRole === 'ceo' || targetRole === 'root') {
      return { allowed: false, reason: 'CEO cannot delete executive peers or Root.' };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: 'Only Root and CEO hold staff de-provisioning authority.' };
}
