# Task: Implement Schedule Sync Cron Job

## Task ID
`phase-4/001-schedule-sync-cron-job`

## Description
Create an automated scheduled job that syncs NBA game schedule data daily, ensuring the database always has up-to-date game information.

## Prerequisites
- `phase-3/001-nba-schedule-api-integration` completed

## Expected Outcomes
1. Cron job that runs daily at configured time
2. Syncs past 3 days and upcoming 7 days of games
3. Logs execution results
4. Handles errors without crashing the server

## Deliverables

### File Structure
```
backend/src/jobs/
├── index.ts                # Job runner/scheduler
├── scheduleSync.ts         # Schedule sync job
└── types.ts                # Job-related types
```

### Dependencies to Install
```json
{
  "dependencies": {
    "node-cron": "^3.x"
  },
  "devDependencies": {
    "@types/node-cron": "^3.x"
  }
}
```

### Job Types
```typescript
// backend/src/jobs/types.ts

export interface JobResult {
  jobName: string;
  status: 'success' | 'failure';
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
  result?: Record<string, any>;
  error?: string;
}

export interface JobConfig {
  name: string;
  schedule: string;  // Cron expression
  enabled: boolean;
  handler: () => Promise<any>;
}
```

### Schedule Sync Job
```typescript
// backend/src/jobs/scheduleSync.ts

import { scheduleService } from '../services/schedule';
import { JobResult } from './types';

export async function runScheduleSync(): Promise<JobResult> {
  const startedAt = new Date();
  const jobName = 'schedule-sync';

  console.log(`[${jobName}] Starting schedule sync...`);

  try {
    // Sync past 3 days and upcoming 7 days
    const result = await scheduleService.syncRecentAndUpcoming();

    const completedAt = new Date();

    const jobResult: JobResult = {
      jobName,
      status: 'success',
      startedAt,
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      result: {
        gamesAdded: result.gamesAdded,
        gamesUpdated: result.gamesUpdated,
        errors: result.errors,
      },
    };

    console.log(`[${jobName}] Completed successfully:`, jobResult.result);

    return jobResult;
  } catch (error) {
    const completedAt = new Date();

    const jobResult: JobResult = {
      jobName,
      status: 'failure',
      startedAt,
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    console.error(`[${jobName}] Failed:`, jobResult.error);

    return jobResult;
  }
}
```

### Job Scheduler
```typescript
// backend/src/jobs/index.ts

import cron from 'node-cron';
import { env } from '../config/env';
import { runScheduleSync } from './scheduleSync';
import { JobConfig, JobResult } from './types';

// Job execution history (in-memory, consider using DB for production)
const jobHistory: JobResult[] = [];
const MAX_HISTORY = 100;

// Job configurations
const jobs: JobConfig[] = [
  {
    name: 'schedule-sync',
    schedule: '0 6 * * *',  // 6:00 AM every day
    enabled: true,
    handler: runScheduleSync,
  },
];

// Track scheduled tasks for cleanup
const scheduledTasks: cron.ScheduledTask[] = [];

export function initializeJobs(): void {
  if (env.nodeEnv === 'test') {
    console.log('Skipping job initialization in test environment');
    return;
  }

  console.log('Initializing scheduled jobs...');

  for (const job of jobs) {
    if (!job.enabled) {
      console.log(`[${job.name}] Disabled, skipping`);
      continue;
    }

    if (!cron.validate(job.schedule)) {
      console.error(`[${job.name}] Invalid cron expression: ${job.schedule}`);
      continue;
    }

    const task = cron.schedule(job.schedule, async () => {
      console.log(`[${job.name}] Triggered by schedule`);
      const result = await job.handler();
      recordJobResult(result);
    }, {
      timezone: 'America/New_York', // EST
    });

    scheduledTasks.push(task);
    console.log(`[${job.name}] Scheduled: ${job.schedule} (EST)`);
  }

  console.log(`Initialized ${scheduledTasks.length} scheduled jobs`);
}

export function stopJobs(): void {
  for (const task of scheduledTasks) {
    task.stop();
  }
  scheduledTasks.length = 0;
  console.log('All scheduled jobs stopped');
}

function recordJobResult(result: JobResult): void {
  jobHistory.unshift(result);
  if (jobHistory.length > MAX_HISTORY) {
    jobHistory.pop();
  }
}

export function getJobHistory(limit: number = 10): JobResult[] {
  return jobHistory.slice(0, limit);
}

export function getLastJobResult(jobName: string): JobResult | undefined {
  return jobHistory.find(r => r.jobName === jobName);
}

// Manual trigger functions
export async function triggerScheduleSync(): Promise<JobResult> {
  const result = await runScheduleSync();
  recordJobResult(result);
  return result;
}
```

### Server Integration
```typescript
// backend/src/index.ts (update existing)

import { initializeJobs, stopJobs } from './jobs';

// After server starts
app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);

  // Initialize scheduled jobs
  initializeJobs();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  stopJobs();
  // ... other cleanup
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  stopJobs();
  // ... other cleanup
});
```

### Health Check Enhancement
```typescript
// Update backend/src/routes/health.ts

import { getLastJobResult } from '../jobs';

router.get('/', async (req, res) => {
  // ... existing code ...

  const scheduleSyncStatus = getLastJobResult('schedule-sync');

  res.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: dbStatus,
    },
    jobs: {
      scheduleSync: scheduleSyncStatus ? {
        lastRun: scheduleSyncStatus.completedAt,
        status: scheduleSyncStatus.status,
        durationMs: scheduleSyncStatus.durationMs,
      } : null,
    },
  });
});
```

### Environment Configuration
```bash
# Add to .env.example

# Jobs
ENABLE_SCHEDULED_JOBS=true
SCHEDULE_SYNC_CRON=0 6 * * *
```

## Acceptance Criteria
- [ ] Cron job initializes on server start
- [ ] Job runs at configured schedule (6 AM EST)
- [ ] Job can be triggered manually for testing
- [ ] Job results recorded in history
- [ ] Health check shows last job execution
- [ ] Job errors logged but don't crash server
- [ ] Jobs stop gracefully on shutdown
- [ ] Jobs disabled in test environment

## Technical Notes
- Use node-cron for in-process scheduling
- Timezone set to EST (NBA games in US)
- Consider external scheduler (Vercel cron) for serverless deployment
- Keep job history in memory for simplicity (use DB for production)

## Estimated Complexity
Medium - Cron scheduling with error handling

## Dependencies
- Task `phase-3/001-nba-schedule-api-integration`
