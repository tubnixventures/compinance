import { ApiResponse } from '../schema/common';

export function okResponse<T>(data: T, message?: string, meta?: Record<string, any>): ApiResponse<T> {
  return { success: true, data, message, meta };
}

export function errorResponse(message: string, code: string = 'BAD_REQUEST', meta?: Record<string, any>): ApiResponse {
  return { success: false, error: message, code, meta };
}

export function unauthorizedResponse(message: string = 'Authentication required'): ApiResponse {
  return { success: false, error: message, code: 'UNAUTHORIZED' };
}

export function forbiddenResponse(message: string = 'Access denied: insufficient hierarchy or role permissions'): ApiResponse {
  return { success: false, error: message, code: 'FORBIDDEN' };
}

export function notFoundResponse(message: string = 'Resource not found'): ApiResponse {
  return { success: false, error: message, code: 'NOT_FOUND' };
}
