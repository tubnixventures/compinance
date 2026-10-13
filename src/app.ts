import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { geoFencingMiddleware } from './middleware/geo-fencing';
import { auditLoggerMiddleware } from './middleware/audit-logger';
import { authRateLimiter } from './middleware/rate-limiter';
import { authMiddleware } from './middleware/auth';
import { requireStaffRole } from './middleware/rbac';

// Handlers
import { handleSignup } from './endpoints/auth/signup';
import { handleLogin } from './endpoints/auth/login';
import { handleOtpRequest } from './endpoints/auth/otp-request';
import { handleOtpVerify } from './endpoints/auth/otp-verify';
import { handleRefreshToken } from './endpoints/auth/refresh-token';
import { handleForgotPassword } from './endpoints/auth/forgot-password';
import { handleResetPassword } from './endpoints/auth/reset-password';
import { handleLogout } from './endpoints/auth/logout';

import { handleVerifyAccount } from './endpoints/users/verify-account';
import { handleParentChallenge } from './endpoints/users/parent-challenge';
import { handleVerifyParentOtp } from './endpoints/users/verify-parent-otp';
import { handleGetProfile } from './endpoints/users/profile';
import { handleListUsers } from './endpoints/users/list';
import { handleApproveAccount } from './endpoints/users/approve-account';
import { handleSetLoanLimit } from './endpoints/users/set-loan-limit';

import { handleCreateStaff } from './endpoints/staff/create';
import { handleListStaff } from './endpoints/staff/list';
import { handleAssignPermissions } from './endpoints/staff/assign-permissions';
import { handleDeleteStaff } from './endpoints/staff/delete';
import { handleGetAuditTrail } from './endpoints/staff/audit-trail';

import { handleApplyLoan } from './endpoints/loans/apply';
import { handleListLoans } from './endpoints/loans/list';
import { handleApproveLoan } from './endpoints/loans/approve';
import { handleRepayLoan } from './endpoints/loans/repay';
import { handlePawaPayWebhook } from './endpoints/loans/webhook';
import { handleGetLoanInventory } from './endpoints/loans/inventory';
import { handleAssignCollection } from './endpoints/loans/assign-collection';

import { handleGetDocsHtml, handleGetDocsSpec } from './endpoints/docs';

export const app = new Hono();

app.use('*', cors({ origin: (o) => o || '*', credentials: true }));
app.use('*', geoFencingMiddleware);
app.use('*', auditLoggerMiddleware);

// Open Documentation
app.get('/doc', handleGetDocsHtml);
app.get('/doc/spec', handleGetDocsSpec);
app.get('/docs', handleGetDocsHtml);
app.get('/docs/spec', handleGetDocsSpec);
app.get('/api/docs/spec', handleGetDocsSpec);
app.get('/health', (c) => c.json({ status: 'UP', service: 'Compinance Core Backend', timestamp: Date.now() }));

// Auth Routes (Rate Limited)
app.use('/api/auth/*', authRateLimiter);
app.post('/api/auth/signup', handleSignup);
app.post('/api/auth/login', handleLogin);
app.post('/api/auth/otp-request', handleOtpRequest);
app.post('/api/auth/otp-verify', handleOtpVerify);
app.post('/api/auth/refresh-token', handleRefreshToken);
app.post('/api/auth/forgot-password', handleForgotPassword);
app.post('/api/auth/reset-password', handleResetPassword);
app.post('/api/auth/logout', handleLogout);

// Protected User Routes
app.post('/api/users/verify-account', authMiddleware, handleVerifyAccount);
app.post('/api/users/verify-parent-otp', authMiddleware, handleVerifyParentOtp);
app.get('/api/users/profile', authMiddleware, handleGetProfile);
app.get('/api/users/list', authMiddleware, requireStaffRole(), handleListUsers);
app.post('/api/users/approve-account', authMiddleware, requireStaffRole(), handleApproveAccount);
app.post('/api/users/set-loan-limit', authMiddleware, requireStaffRole(), handleSetLoanLimit);
app.post('/api/users/parent-challenge', authMiddleware, requireStaffRole(), handleParentChallenge);

// Protected Staff Routes
app.post('/api/staff/create', authMiddleware, requireStaffRole(), handleCreateStaff);
app.get('/api/staff/list', authMiddleware, requireStaffRole(), handleListStaff);
app.post('/api/staff/assign-permissions', authMiddleware, requireStaffRole('ceo'), handleAssignPermissions);
app.delete('/api/staff/delete', authMiddleware, requireStaffRole(), handleDeleteStaff);
app.get('/api/staff/audit-trail', authMiddleware, requireStaffRole('manager'), handleGetAuditTrail);

// Loan & PawaPay Routes
app.post('/api/loans/apply', authMiddleware, handleApplyLoan);
app.get('/api/loans/list', authMiddleware, handleListLoans);
app.post('/api/loans/approve', authMiddleware, requireStaffRole(), handleApproveLoan);
app.post('/api/loans/repay', authMiddleware, handleRepayLoan);
app.post('/api/loans/webhook', handlePawaPayWebhook); // PawaPay asynchronous webhook
app.get('/api/loans/inventory', authMiddleware, requireStaffRole(), handleGetLoanInventory);
app.post('/api/loans/assign-collection', authMiddleware, requireStaffRole('ceo'), handleAssignCollection);
