export interface ResetPasswordBody {
  email: string;
  code: string;
  newPassword: string;
}
