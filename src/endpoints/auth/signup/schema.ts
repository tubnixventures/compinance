export interface SignupBody {
  fullName: string;
  email: string;
  phone: string;
  nationalIdNumber?: string;
  password?: string;
  whatsapp?: boolean;
}
