import { Role, StaffDuties } from '../../../schema/roles';

export interface CreateStaffBody {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  role: Role;
  duties?: StaffDuties;
}
