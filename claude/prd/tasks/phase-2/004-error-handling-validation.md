# Task: Implement Error Handling & Input Validation

## Task ID
`phase-2/004-error-handling-validation`

## Description
Create comprehensive error handling middleware and input validation utilities for consistent, user-friendly error responses across all API endpoints.

## Prerequisites
- `phase-2/003-admin-api-endpoints` completed

## Expected Outcomes
1. Centralized error handling middleware
2. Custom error classes for different error types
3. Input validation utilities using zod or similar
4. Consistent error response format across all endpoints
5. Proper logging of errors for debugging

## Deliverables

### Custom Error Classes
```typescript
// backend/src/errors/index.ts

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, `${resource.toUpperCase()}_NOT_FOUND`);
  }
}

export class ValidationError extends AppError {
  public readonly details: Record<string, string>;

  constructor(message: string, details: Record<string, string> = {}) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
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

export class ExternalApiError extends AppError {
  public readonly service: string;

  constructor(service: string, message: string) {
    super(`${service} API error: ${message}`, 502, 'EXTERNAL_API_ERROR');
    this.service = service;
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}
```

### Error Handling Middleware
```typescript
// backend/src/middleware/errorHandler.ts

import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../errors';
import { env } from '../config/env';

interface ErrorResponse {
  error: string;
  code: string;
  details?: Record<string, string>;
  stack?: string;
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error
  console.error(`[ERROR] ${req.method} ${req.path}:`, {
    message: err.message,
    stack: err.stack,
    ...(err instanceof AppError && { code: err.code }),
  });

  // Handle known errors
  if (err instanceof AppError) {
    const response: ErrorResponse = {
      error: err.message,
      code: err.code,
    };

    if (err instanceof ValidationError && Object.keys(err.details).length > 0) {
      response.details = err.details;
    }

    if (env.nodeEnv === 'development') {
      response.stack = err.stack;
    }

    return res.status(err.statusCode).json(response);
  }

  // Handle unexpected errors
  const response: ErrorResponse = {
    error: env.nodeEnv === 'production'
      ? 'An unexpected error occurred'
      : err.message,
    code: 'INTERNAL_ERROR',
  };

  if (env.nodeEnv === 'development') {
    response.stack = err.stack;
  }

  res.status(500).json(response);
}
```

### Not Found Handler
```typescript
// backend/src/middleware/notFoundHandler.ts

import { Request, Response } from 'express';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND',
  });
}
```

### Input Validation with Zod
```typescript
// backend/src/validation/index.ts

import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors';

// Common schemas
export const schemas = {
  // Date in YYYY-MM-DD format
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),

  // Positive integer ID
  id: z.string().transform((val, ctx) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Must be a positive integer',
      });
      return z.NEVER;
    }
    return parsed;
  }),

  // Team abbreviation
  abbreviation: z.string().length(3).toUpperCase(),

  // Pagination limit
  limit: z.string().optional().transform((val) => {
    if (!val) return 10;
    const parsed = parseInt(val, 10);
    return Math.min(Math.max(parsed || 10, 1), 50);
  }),

  // Conference filter
  conference: z.enum(['Eastern', 'Western']).optional(),

  // Admin schedule sync request
  adminScheduleSync: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }).optional(),

  // Admin video discovery request
  adminVideoDiscovery: z.object({
    limit: z.number().min(1).max(50).optional().default(10),
  }).optional(),
};

// Validation middleware factory
export function validate<T extends z.ZodTypeAny>(
  schema: T,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join('.');
        details[path || 'value'] = issue.message;
      });

      throw new ValidationError('Validation failed', details);
    }

    req[source] = result.data;
    next();
  };
}
```

### Async Route Wrapper
```typescript
// backend/src/utils/asyncHandler.ts

import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

### Updated Route Example
```typescript
// Example of using validation and error handling in routes
import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate, schemas } from '../../validation';
import { NotFoundError } from '../../errors';
import { gameQueries } from '../../db/queries';

const router = Router();

router.get(
  '/date/:date',
  validate(z.object({ date: schemas.date }), 'params'),
  asyncHandler(async (req, res) => {
    const { date } = req.params;
    const games = await gameQueries.findByDate(date);

    res.json({
      date,
      games: games.map(formatGameWithVideo),
    });
  })
);

router.get(
  '/:id',
  validate(z.object({ id: schemas.id }), 'params'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const game = await gameQueries.findByIdWithDetails(id);

    if (!game) {
      throw new NotFoundError('Game', id);
    }

    res.json({ game: formatGameWithVideo(game) });
  })
);
```

### Dependencies to Install
```json
{
  "dependencies": {
    "zod": "^3.x"
  }
}
```

## Acceptance Criteria
- [ ] All API errors return consistent JSON format
- [ ] Validation errors include field-level details
- [ ] 404 errors for missing routes handled gracefully
- [ ] Stack traces hidden in production
- [ ] Stack traces visible in development
- [ ] Async route errors caught properly
- [ ] All existing endpoints use validation middleware
- [ ] Custom error classes work correctly

## Technical Notes
- Use `express-async-errors` as alternative to asyncHandler wrapper
- Zod provides runtime validation and TypeScript types
- Error middleware must be registered last
- Log errors before sending response

## Estimated Complexity
Medium - Cross-cutting concern with multiple components

## Dependencies
- Task `phase-2/003-admin-api-endpoints`
