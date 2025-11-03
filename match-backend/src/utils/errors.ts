import { ErrorCode } from '../types.js';

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    public statusCode: number,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: Record<string, any>) {
    super('MATCH_VALIDATION_ERROR', 400, message, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super('MATCH_UNAUTHORIZED', 401, message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super('MATCH_FORBIDDEN', 403, message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Not found') {
    super('MATCH_NOT_FOUND', 404, message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Conflict') {
    super('MATCH_CONFLICT', 409, message);
    this.name = 'ConflictError';
  }
}

export class PaymentFailedError extends ApiError {
  constructor(message: string = 'Payment failed', details?: Record<string, any>) {
    super('MATCH_PAYMENT_FAILED', 402, message, details);
    this.name = 'PaymentFailedError';
  }
}

export class RefundNotAllowedError extends ApiError {
  constructor(message: string = 'Refund not allowed') {
    super('MATCH_REFUND_NOT_ALLOWED', 400, message);
    this.name = 'RefundNotAllowedError';
  }
}
