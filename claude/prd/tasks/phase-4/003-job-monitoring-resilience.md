# Task: Implement Job Monitoring & Resilience

## Task ID
`phase-4/003-job-monitoring-resilience`

## Description
Add monitoring, logging, and resilience features to the job system including execution history persistence, failure alerting, and automatic recovery mechanisms.

## Prerequisites
- `phase-4/002-video-discovery-cron-job` completed

## Expected Outcomes
1. Job execution history persisted to database
2. Failed job tracking with retry mechanism
3. Job status monitoring endpoint
4. Structured logging for all job operations
5. Automatic recovery from transient failures

## Deliverables

### Job History Database Table
```typescript
// Migration: create-job-history-table.js

exports.up = (pgm) => {
  pgm.createTable('job_history', {
    id: 'id',
    job_name: { type: 'varchar(50)', notNull: true },
    status: { type: 'varchar(20)', notNull: true }, // success, failure, skipped
    started_at: { type: 'timestamp with time zone', notNull: true },
    completed_at: { type: 'timestamp with time zone', notNull: true },
    duration_ms: { type: 'integer', notNull: true },
    result: { type: 'jsonb' },
    error: { type: 'text' },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  pgm.createIndex('job_history', 'job_name');
  pgm.createIndex('job_history', ['job_name', 'created_at']);
  pgm.createIndex('job_history', 'status');
};

exports.down = (pgm) => {
  pgm.dropTable('job_history');
};
```

### Job History Queries
```typescript
// backend/src/db/queries/jobHistory.ts

import { db } from '../index';
import { JobResult } from '../../jobs/types';

export interface JobHistoryEntry {
  id: number;
  job_name: string;
  status: string;
  started_at: Date;
  completed_at: Date;
  duration_ms: number;
  result: Record<string, any> | null;
  error: string | null;
  created_at: Date;
}

export const jobHistoryQueries = {
  async record(result: JobResult): Promise<void> {
    await db.query(
      `INSERT INTO job_history (job_name, status, started_at, completed_at, duration_ms, result, error)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        result.jobName,
        result.status,
        result.startedAt,
        result.completedAt,
        result.durationMs,
        result.result ? JSON.stringify(result.result) : null,
        result.error || null,
      ]
    );
  },

  async findRecent(jobName: string, limit: number = 10): Promise<JobHistoryEntry[]> {
    const result = await db.query<JobHistoryEntry>(
      `SELECT * FROM job_history
       WHERE job_name = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [jobName, limit]
    );
    return result.rows;
  },

  async findLast(jobName: string): Promise<JobHistoryEntry | null> {
    const result = await db.query<JobHistoryEntry>(
      `SELECT * FROM job_history
       WHERE job_name = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [jobName]
    );
    return result.rows[0] || null;
  },

  async getFailureCount(jobName: string, hours: number = 24): Promise<number> {
    const result = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM job_history
       WHERE job_name = $1
       AND status = 'failure'
       AND created_at > NOW() - INTERVAL '${hours} hours'`,
      [jobName]
    );
    return parseInt(result.rows[0].count, 10);
  },

  async cleanup(daysToKeep: number = 30): Promise<number> {
    const result = await db.query(
      `DELETE FROM job_history
       WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'`
    );
    return result.rowCount || 0;
  },
};
```

### Structured Logger
```typescript
// backend/src/utils/logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: Record<string, any>;
}

class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private log(level: LogLevel, message: string, data?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      data,
    };

    const output = JSON.stringify(entry);

    switch (level) {
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

  debug(message: string, data?: Record<string, any>): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, any>): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, any>): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: Record<string, any>): void {
    this.log('error', message, data);
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}
```

### Job Runner with Resilience
```typescript
// backend/src/jobs/runner.ts

import { createLogger } from '../utils/logger';
import { jobHistoryQueries } from '../db/queries/jobHistory';
import { JobResult, JobConfig } from './types';

const logger = createLogger('JobRunner');

interface RunOptions {
  maxRetries?: number;
  retryDelayMs?: number;
}

export async function runWithRetry(
  job: JobConfig,
  options: RunOptions = {}
): Promise<JobResult> {
  const { maxRetries = 3, retryDelayMs = 5000 } = options;

  let lastResult: JobResult | null = null;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;

    logger.info(`Executing job`, {
      job: job.name,
      attempt,
      maxRetries,
    });

    try {
      const result = await job.handler();

      // Record to database
      await jobHistoryQueries.record(result);

      if (result.status === 'success') {
        logger.info(`Job completed successfully`, {
          job: job.name,
          attempt,
          durationMs: result.durationMs,
          result: result.result,
        });
        return result;
      }

      lastResult = result;

      // Job returned failure status
      logger.warn(`Job returned failure`, {
        job: job.name,
        attempt,
        error: result.error,
      });

    } catch (error) {
      lastResult = {
        jobName: job.name,
        status: 'failure',
        startedAt: new Date(),
        completedAt: new Date(),
        durationMs: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      logger.error(`Job threw exception`, {
        job: job.name,
        attempt,
        error: lastResult.error,
      });

      await jobHistoryQueries.record(lastResult);
    }

    // Wait before retry (if not last attempt)
    if (attempt < maxRetries) {
      const delay = retryDelayMs * attempt; // Exponential backoff
      logger.info(`Retrying job after delay`, {
        job: job.name,
        delayMs: delay,
      });
      await sleep(delay);
    }
  }

  logger.error(`Job failed after all retries`, {
    job: job.name,
    attempts: attempt,
  });

  return lastResult!;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if job should be skipped based on recent failures
export async function shouldSkipJob(jobName: string): Promise<boolean> {
  const recentFailures = await jobHistoryQueries.getFailureCount(jobName, 1);

  // Skip if 3+ failures in the last hour (likely systemic issue)
  if (recentFailures >= 3) {
    logger.warn(`Skipping job due to recent failures`, {
      job: jobName,
      recentFailures,
    });
    return true;
  }

  return false;
}
```

### Job Status Endpoint
```typescript
// backend/src/routes/api/jobs.ts

import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { jobHistoryQueries } from '../../db/queries/jobHistory';
import { youtubeService } from '../../services/youtube';

const router = Router();

// GET /api/jobs/status
router.get('/status', asyncHandler(async (req, res) => {
  const [scheduleSyncHistory, videoDiscoveryHistory] = await Promise.all([
    jobHistoryQueries.findRecent('schedule-sync', 5),
    jobHistoryQueries.findRecent('video-discovery', 5),
  ]);

  const quota = youtubeService.getQuotaStatus();

  res.json({
    jobs: {
      scheduleSync: {
        lastRun: scheduleSyncHistory[0] || null,
        recentHistory: scheduleSyncHistory,
      },
      videoDiscovery: {
        lastRun: videoDiscoveryHistory[0] || null,
        recentHistory: videoDiscoveryHistory,
      },
    },
    quota: {
      youtube: quota,
    },
  });
}));

// GET /api/jobs/history/:jobName
router.get('/history/:jobName', asyncHandler(async (req, res) => {
  const { jobName } = req.params;
  const limit = parseInt(req.query.limit as string) || 20;

  const history = await jobHistoryQueries.findRecent(jobName, Math.min(limit, 100));

  res.json({
    jobName,
    history,
  });
}));

export default router;
```

### History Cleanup Job
```typescript
// backend/src/jobs/cleanup.ts

import { createLogger } from '../utils/logger';
import { jobHistoryQueries } from '../db/queries/jobHistory';
import { JobResult } from './types';

const logger = createLogger('CleanupJob');

export async function runHistoryCleanup(): Promise<JobResult> {
  const startedAt = new Date();
  const jobName = 'history-cleanup';

  logger.info('Starting history cleanup');

  try {
    const deleted = await jobHistoryQueries.cleanup(30);

    const completedAt = new Date();

    logger.info('History cleanup completed', { deleted });

    return {
      jobName,
      status: 'success',
      startedAt,
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      result: { entriesDeleted: deleted },
    };
  } catch (error) {
    const completedAt = new Date();

    logger.error('History cleanup failed', {
      error: error instanceof Error ? error.message : 'Unknown',
    });

    return {
      jobName,
      status: 'failure',
      startedAt,
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

## Acceptance Criteria
- [ ] Job execution history persisted to database
- [ ] Recent job history viewable via API
- [ ] Jobs retry automatically on transient failures
- [ ] Jobs skip if too many recent failures
- [ ] Structured JSON logging for all job operations
- [ ] History cleanup runs weekly
- [ ] Job status endpoint shows quota and recent runs
- [ ] Old history automatically deleted

## Technical Notes
- Keep 30 days of job history
- Exponential backoff on retries
- Skip job if 3+ failures in last hour
- JSON logging for easier parsing in production

## Estimated Complexity
Medium - Database persistence and resilience patterns

## Dependencies
- Task `phase-4/002-video-discovery-cron-job`
