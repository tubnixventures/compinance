export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
  meta?: Record<string, any>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // 3600 seconds
  refreshExpiresIn: number; // 60 days in seconds
  tokenType: 'Bearer';
}

export interface OtpRecord {
  id: string;
  target: string; // email or phone
  code: string;
  purpose: 'login' | 'forgot_password' | 'parent_challenge';
  expiresAt: number;
  attempts: number;
  verified: boolean;
  createdAt: number;
}
