# Task: Implement Logging & Observability

## Task ID
`phase-7/001-logging-observability`

## Description
Set up structured logging and basic observability for the production application to enable debugging and monitoring.

## Prerequisites
- `phase-6/005-production-validation` completed

## Expected Outcomes
1. Structured JSON logging in production
2. Request/response logging with timing
3. Error logging with context
4. Log levels configurable by environment

## Deliverables

### Structured Logger

```typescript
// backend/src/utils/logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  requestId?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  data?: LogContext;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private context: string;
  private minLevel: LogLevel;

  constructor(context: string) {
    this.context = context;
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private formatEntry(level: LogLevel, message: string, data?: LogContext): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
    };

    if (data) {
      // Extract special fields
      if (data.requestId) {
        entry.requestId = data.requestId;
        delete data.requestId;
      }
      if (data.duration) {
        entry.duration = data.duration;
        delete data.duration;
      }
      if (data.error instanceof Error) {
        entry.error = {
          name: data.error.name,
          message: data.error.message,
          stack: process.env.NODE_ENV !== 'production' ? data.error.stack : undefined,
        };
        delete data.error;
      }
      if (Object.keys(data).length > 0) {
        entry.data = data;
      }
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    const output = JSON.stringify(entry);

    switch (entry.level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }

  debug(message: string, data?: LogContext): void {
    if (this.shouldLog('debug')) {
      this.output(this.formatEntry('debug', message, data));
    }
  }

  info(message: string, data?: LogContext): void {
    if (this.shouldLog('info')) {
      this.output(this.formatEntry('info', message, data));
    }
  }

  warn(message: string, data?: LogContext): void {
    if (this.shouldLog('warn')) {
      this.output(this.formatEntry('warn', message, data));
    }
  }

  error(message: string, data?: LogContext): void {
    if (this.shouldLog('error')) {
      this.output(this.formatEntry('error', message, data));
    }
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}

// Default app logger
export const logger = createLogger('App');
```

### Request Logging Middleware

```typescript
// backend/src/middleware/requestLogger.ts

import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';
import { randomUUID } from 'crypto';

const logger = createLogger('HTTP');

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Assign unique request ID
  req.requestId = req.headers['x-request-id'] as string || randomUUID();
  req.startTime = Date.now();

  // Log request
  logger.info('Request started', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;

    const logLevel = res.statusCode >= 500 ? 'error' :
                     res.statusCode >= 400 ? 'warn' : 'info';

    logger[logLevel]('Request completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
    });
  });

  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId);

  next();
}
```

### Error Logging Enhancement

```typescript
// backend/src/middleware/errorHandler.ts (update)

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('Error');

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = req.requestId;
  const isOperational = err instanceof AppError && err.isOperational;

  // Log error
  logger.error('Request error', {
    requestId,
    error: err,
    path: req.path,
    method: req.method,
    isOperational,
  });

  // Response handling...
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      requestId,
    });
  }

  // Unexpected errors
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
    code: 'INTERNAL_ERROR',
    requestId,
  });
}
```

### Job Logging

```typescript
// backend/src/jobs/scheduleSync.ts (update)

import { createLogger } from '../utils/logger';

const logger = createLogger('Job:ScheduleSync');

export async function runScheduleSync(): Promise<JobResult> {
  const startedAt = new Date();
  const jobId = `schedule-sync-${startedAt.getTime()}`;

  logger.info('Job started', { jobId });

  try {
    const result = await scheduleService.syncRecentAndUpcoming();

    logger.info('Job completed', {
      jobId,
      duration: Date.now() - startedAt.getTime(),
      gamesAdded: result.gamesAdded,
      gamesUpdated: result.gamesUpdated,
      errors: result.errors,
    });

    return {
      jobName: 'schedule-sync',
      status: 'success',
      // ...
    };
  } catch (error) {
    logger.error('Job failed', {
      jobId,
      duration: Date.now() - startedAt.getTime(),
      error: error as Error,
    });

    return {
      jobName: 'schedule-sync',
      status: 'failure',
      // ...
    };
  }
}
```

### API Service Logging

```typescript
// backend/src/services/youtube/client.ts (update)

import { createLogger } from '../../utils/logger';

const logger = createLogger('YouTube');

export async function searchVideos(params: YouTubeSearchParams) {
  logger.debug('Searching videos', {
    query: params.query,
    channelId: params.channelId,
  });

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      logger.warn('YouTube API error', {
        status: response.status,
        query: params.query,
      });
      throw new ExternalApiError('YouTube', response.statusText);
    }

    const data = await response.json();

    logger.debug('Search completed', {
      query: params.query,
      resultsCount: data.items?.length || 0,
    });

    return data;
  } catch (error) {
    logger.error('YouTube API failed', {
      error: error as Error,
      query: params.query,
    });
    throw error;
  }
}
```

### Environment Configuration

```bash
# .env additions

# Logging
LOG_LEVEL=info  # debug, info, warn, error
```

### Log Output Examples

**Request log:**
```json
{
  "timestamp": "2024-12-14T18:30:00.000Z",
  "level": "info",
  "message": "Request completed",
  "context": "HTTP",
  "requestId": "abc-123-def",
  "data": {
    "method": "GET",
    "path": "/api/teams/1/games",
    "statusCode": 200
  },
  "duration": 145
}
```

**Error log:**
```json
{
  "timestamp": "2024-12-14T18:30:00.000Z",
  "level": "error",
  "message": "Request error",
  "context": "Error",
  "requestId": "abc-123-def",
  "error": {
    "name": "NotFoundError",
    "message": "Team not found"
  },
  "data": {
    "path": "/api/teams/999",
    "method": "GET"
  }
}
```

**Job log:**
```json
{
  "timestamp": "2024-12-14T06:00:00.000Z",
  "level": "info",
  "message": "Job completed",
  "context": "Job:ScheduleSync",
  "data": {
    "jobId": "schedule-sync-1702540800000",
    "gamesAdded": 15,
    "gamesUpdated": 8,
    "errors": 0
  },
  "duration": 2340
}
```

## Acceptance Criteria
- [ ] All requests logged with timing
- [ ] Request IDs trackable through logs
- [ ] Errors logged with stack traces (dev only)
- [ ] Log levels respect environment config
- [ ] Job executions logged
- [ ] External API calls logged
- [ ] Logs are valid JSON
- [ ] No sensitive data in logs

## Technical Notes
- Use JSON format for log aggregation services
- Request IDs enable tracing across services
- Hide stack traces in production
- Consider log rotation for long-running processes

## Estimated Complexity
Medium - Cross-cutting logging implementation

## Dependencies
- Task `phase-6/005-production-validation`
