# Task: Implement Video Discovery Cron Job

## Task ID
`phase-4/002-video-discovery-cron-job`

## Description
Create an automated scheduled job that searches for highlight videos for finished games, running periodically throughout the day to find newly uploaded content.

## Prerequisites
- `phase-4/001-schedule-sync-cron-job` completed
- `phase-3/003-video-matcher-service` completed

## Expected Outcomes
1. Cron job that runs every 2 hours
2. Discovers videos for finished games without videos
3. Respects YouTube API quota limits
4. Tracks discovery success rate

## Deliverables

### Video Discovery Job
```typescript
// backend/src/jobs/videoDiscovery.ts

import { videoMatcherService } from '../services/videoMatcher';
import { youtubeService } from '../services/youtube';
import { JobResult } from './types';

export interface VideoDiscoveryOptions {
  limit?: number;
  minHoursAfterGame?: number;
}

export async function runVideoDiscovery(
  options: VideoDiscoveryOptions = {}
): Promise<JobResult> {
  const startedAt = new Date();
  const jobName = 'video-discovery';

  console.log(`[${jobName}] Starting video discovery...`);

  // Check quota before starting
  const quotaBefore = youtubeService.getQuotaStatus();
  console.log(`[${jobName}] Quota status:`, quotaBefore);

  if (quotaBefore.remaining < 200) {
    console.log(`[${jobName}] Insufficient quota remaining, skipping`);

    return {
      jobName,
      status: 'success',
      startedAt,
      completedAt: new Date(),
      durationMs: 0,
      result: {
        skipped: true,
        reason: 'Insufficient quota',
        quotaRemaining: quotaBefore.remaining,
      },
    };
  }

  try {
    const result = await videoMatcherService.discoverVideos({
      limit: options.limit || 10,
      minHoursAfterGame: options.minHoursAfterGame || 3,
    });

    const completedAt = new Date();
    const quotaAfter = youtubeService.getQuotaStatus();

    const jobResult: JobResult = {
      jobName,
      status: 'success',
      startedAt,
      completedAt,
      durationMs: completedAt.getTime() - startedAt.getTime(),
      result: {
        gamesProcessed: result.gamesProcessed,
        videosFound: result.videosFound,
        videosFailed: result.videosFailed,
        successRate: result.gamesProcessed > 0
          ? ((result.videosFound / result.gamesProcessed) * 100).toFixed(1) + '%'
          : 'N/A',
        quotaUsed: quotaAfter.used - quotaBefore.used,
        quotaRemaining: quotaAfter.remaining,
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

### Update Job Scheduler
```typescript
// backend/src/jobs/index.ts (add to existing)

import { runVideoDiscovery, VideoDiscoveryOptions } from './videoDiscovery';

// Add to jobs array
const jobs: JobConfig[] = [
  {
    name: 'schedule-sync',
    schedule: '0 6 * * *',  // 6:00 AM every day
    enabled: true,
    handler: runScheduleSync,
  },
  {
    name: 'video-discovery',
    schedule: '0 */2 * * *',  // Every 2 hours
    enabled: true,
    handler: () => runVideoDiscovery({ limit: 10 }),
  },
];

// Add manual trigger
export async function triggerVideoDiscovery(
  options?: VideoDiscoveryOptions
): Promise<JobResult> {
  const result = await runVideoDiscovery(options);
  recordJobResult(result);
  return result;
}
```

### Enhanced Admin Endpoint
```typescript
// Update backend/src/routes/api/admin.ts

import { triggerVideoDiscovery } from '../../jobs';

// POST /api/admin/fetch-videos (update existing)
router.post('/fetch-videos', async (req: Request, res: Response) => {
  try {
    const { limit = 10, minHoursAfterGame = 3 } = req.body;

    const result = await triggerVideoDiscovery({
      limit: Math.min(limit, 50),
      minHoursAfterGame,
    });

    res.json({
      success: result.status === 'success',
      message: result.status === 'success'
        ? 'Video discovery completed'
        : 'Video discovery failed',
      result: result.result,
      error: result.error,
    });
  } catch (error) {
    console.error('Video discovery failed:', error);
    res.status(500).json({
      success: false,
      error: 'Video discovery failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
```

### Quota-Aware Scheduling
```typescript
// backend/src/jobs/videoDiscovery.ts (add)

import { youtubeService } from '../services/youtube';

// Determine optimal batch size based on remaining quota
export function calculateOptimalBatchSize(): number {
  const quota = youtubeService.getQuotaStatus();

  // Each game search uses ~101 units (100 search + 1 video details)
  const unitsPerGame = 101;
  const safetyBuffer = 500; // Keep buffer for manual operations

  const availableUnits = quota.remaining - safetyBuffer;
  const maxGames = Math.floor(availableUnits / unitsPerGame);

  // Cap at 20 games per run to spread throughout the day
  return Math.min(Math.max(maxGames, 0), 20);
}

// Enhanced job that uses dynamic batch size
export async function runVideoDiscoveryDynamic(): Promise<JobResult> {
  const batchSize = calculateOptimalBatchSize();

  if (batchSize === 0) {
    return {
      jobName: 'video-discovery',
      status: 'success',
      startedAt: new Date(),
      completedAt: new Date(),
      durationMs: 0,
      result: { skipped: true, reason: 'Insufficient quota' },
    };
  }

  return runVideoDiscovery({ limit: batchSize });
}
```

### Update Health Check
```typescript
// Update backend/src/routes/health.ts

router.get('/', async (req, res) => {
  // ... existing code ...

  const videoDiscoveryStatus = getLastJobResult('video-discovery');
  const quotaStatus = youtubeService.getQuotaStatus();

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
      } : null,
      videoDiscovery: videoDiscoveryStatus ? {
        lastRun: videoDiscoveryStatus.completedAt,
        status: videoDiscoveryStatus.status,
        result: videoDiscoveryStatus.result,
      } : null,
    },
    quota: {
      youtube: {
        used: quotaStatus.used,
        remaining: quotaStatus.remaining,
        limit: quotaStatus.limit,
      },
    },
  });
});
```

## Acceptance Criteria
- [ ] Job runs every 2 hours automatically
- [ ] Job checks quota before running
- [ ] Job skips gracefully if quota too low
- [ ] Batch size adapts to remaining quota
- [ ] Job results include success rate
- [ ] Health check shows quota status
- [ ] Manual trigger works via admin endpoint
- [ ] Errors logged but don't crash server

## Technical Notes
- Run every 2 hours: catches videos uploaded throughout the day
- ~12 runs per day × 10 games = ~120 searches = 12,000 units
- Adjust batch size or frequency if hitting quota limits
- Videos typically uploaded 2-4 hours after game ends

## Estimated Complexity
Medium - Quota-aware scheduling

## Dependencies
- Task `phase-4/001-schedule-sync-cron-job`
- Task `phase-3/003-video-matcher-service`
