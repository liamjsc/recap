import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

interface ErrorResponse {
  error: string;
  code: string;
  requestId?: string;
  stack?: string;
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public isOperational = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, `${resource.toUpperCase().replace(/\s+/g, '_')}_NOT_FOUND`);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public details: Record<string, string> = {}
  ) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400, 'BAD_REQUEST');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log error
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message: 'Request error',
      requestId: req.requestId,
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    })
  );

  // Handle known errors
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      error: err.message,
      code: err.code,
      requestId: req.requestId,
    };

    if (err instanceof ValidationError && Object.keys(err.details).length > 0) {
      (response as ErrorResponse & { details: Record<string, string> }).details = err.details;
    }

    if (env.nodeEnv === 'development') {
      response.stack = err.stack;
    }

    return res.status(err.statusCode).json(response);
  }

  // Handle unexpected errors
  const response: ErrorResponse = {
    error: env.nodeEnv === 'production' ? 'An unexpected error occurred' : err.message,
    code: 'INTERNAL_ERROR',
    requestId: req.requestId,
  };

  if (env.nodeEnv === 'development') {
    response.stack = err.stack;
  }

  res.status(500).json(response);
}
