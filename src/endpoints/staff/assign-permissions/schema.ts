import { StaffDuties } from '../../../schema/roles';

export interface AssignPermissionsBody {
  staffId: string;
  duties: StaffDuties;
}
