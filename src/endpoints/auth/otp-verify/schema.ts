export interface OtpVerifyBody {
  email: string;
  code: string;
  purpose?: 'login' | 'forgot_password';
}
