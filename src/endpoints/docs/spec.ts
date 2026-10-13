export const OPENAPI_SPEC = {
  openapi: '3.0.3',
  info: {
    title: 'Compinance Student Loaning API',
    version: '1.0.0',
    description:
      'Backend API for Compinance: Kenya Student Micro-loans powered by PawaPay M-Pesa, Gemini AI document KYC, and Firestore.',
  },
  servers: [{ url: '/api', description: 'Compinance Core Backend' }],
  components: {
    securitySchemes: {
      BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      CookieAuth: { type: 'apiKey', in: 'cookie', name: 'token' },
    },
  },
  tags: [
    { name: 'Auth', description: 'Authentication, Passwordless OTP, and 60-day Refresh Tokens' },
    { name: 'Users & KYC', description: 'Student Verification, Gemini AI Forgery Check, and Admin Approvals' },
    { name: 'Staff & RBAC', description: 'Hierarchy Management, Duties, and Security Audit Logs' },
    { name: 'Loans & PawaPay', description: 'Float Verification, M-Pesa Disbursements, and Repayments' },
  ],
};
