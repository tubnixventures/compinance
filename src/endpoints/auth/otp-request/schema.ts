export interface OtpRequestBody {
  email: string;
  purpose: 'login' | 'forgot_password';
}
