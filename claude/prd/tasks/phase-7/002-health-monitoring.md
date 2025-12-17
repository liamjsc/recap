# Task: Implement Health Monitoring

## Task ID
`phase-7/002-health-monitoring`

## Description
Set up comprehensive health monitoring endpoints and external uptime monitoring for the production application.

## Prerequisites
- `phase-7/001-logging-observability` completed

## Expected Outcomes
1. Enhanced health check endpoint with dependency status
2. External uptime monitoring configured
3. Alerts for downtime
4. YouTube API quota monitoring

## Deliverables

### Enhanced Health Check

```typescript
// backend/src/routes/health.ts

import { Router } from 'express';
import { pool } from '../db/pool';
import { youtubeService } from '../services/youtube';
import { getLastJobResult } from '../jobs';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  checks: {
    database: CheckResult;
    youtubeQuota: CheckResult;
  };
  jobs: {
    scheduleSync: JobStatus | null;
    videoDiscovery: JobStatus | null;
  };
}

interface CheckResult {
  status: 'pass' | 'warn' | 'fail';
  message?: string;
  responseTime?: number;
}

interface JobStatus {
  lastRun: Date | null;
  status: 'success' | 'failure' | 'skipped';
  message?: string;
}

// Detailed health check
router.get('/', async (req, res) => {
  const startTime = Date.now();

  // Check database
  const dbCheck = await checkDatabase();

  // Check YouTube quota
  const quotaCheck = checkYoutubeQuota();

  // Get job statuses
  const scheduleSyncJob = getLastJobResult('schedule-sync');
  const videoDiscoveryJob = getLastJobResult('video-discovery');

  // Determine overall status
  let overallStatus: HealthStatus['status'] = 'healthy';
  if (dbCheck.status === 'fail') {
    overallStatus = 'unhealthy';
  } else if (dbCheck.status === 'warn' || quotaCheck.status === 'warn') {
    overallStatus = 'degraded';
  }

  const response: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    checks: {
      database: dbCheck,
      youtubeQuota: quotaCheck,
    },
    jobs: {
      scheduleSync: scheduleSyncJob ? {
        lastRun: scheduleSyncJob.completedAt,
        status: scheduleSyncJob.status,
      } : null,
      videoDiscovery: videoDiscoveryJob ? {
        lastRun: videoDiscoveryJob.completedAt,
        status: videoDiscoveryJob.status,
      } : null,
    },
  };

  // Set appropriate status code
  const statusCode = overallStatus === 'unhealthy' ? 503 :
                     overallStatus === 'degraded' ? 200 : 200;

  res.status(statusCode).json(response);
});

// Simple health check (for load balancers)
router.get('/live', (req, res) => {
  res.status(200).send('OK');
});

// Readiness check (includes DB)
router.get('/ready', async (req, res) => {
  const dbCheck = await checkDatabase();

  if (dbCheck.status === 'fail') {
    res.status(503).json({ ready: false, reason: 'Database unavailable' });
  } else {
    res.status(200).json({ ready: true });
  }
});

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    const responseTime = Date.now() - start;

    return {
      status: responseTime > 1000 ? 'warn' : 'pass',
      message: responseTime > 1000 ? 'Slow response' : 'Connected',
      responseTime,
    };
  } catch (error) {
    return {
      status: 'fail',
      message: 'Connection failed',
      responseTime: Date.now() - start,
    };
  }
}

function checkYoutubeQuota(): CheckResult {
  const quota = youtubeService.getQuotaStatus();
  const percentUsed = (quota.used / quota.limit) * 100;

  if (percentUsed >= 90) {
    return {
      status: 'warn',
      message: `Quota ${percentUsed.toFixed(0)}% used (${quota.remaining} remaining)`,
    };
  }

  return {
    status: 'pass',
    message: `${quota.remaining} units remaining`,
  };
}

export default router;
```

### Metrics Endpoint (Optional)

```typescript
// backend/src/routes/metrics.ts

import { Router } from 'express';
import { pool } from '../db/pool';
import { youtubeService } from '../services/youtube';

const router = Router();

// Simple metrics endpoint (Prometheus-compatible format optional)
router.get('/', async (req, res) => {
  const [
    teamCount,
    gameCount,
    videoCount,
    finishedGamesWithoutVideos,
  ] = await Promise.all([
    pool.query('SELECT COUNT(*) as count FROM teams'),
    pool.query('SELECT COUNT(*) as count FROM games'),
    pool.query('SELECT COUNT(*) as count FROM videos'),
    pool.query(`
      SELECT COUNT(*) as count FROM games g
      LEFT JOIN videos v ON g.id = v.game_id
      WHERE g.status = 'finished' AND v.id IS NULL
    `),
  ]);

  const quota = youtubeService.getQuotaStatus();

  res.json({
    data: {
      teams: parseInt(teamCount.rows[0].count, 10),
      games: parseInt(gameCount.rows[0].count, 10),
      videos: parseInt(videoCount.rows[0].count, 10),
      pendingVideoDiscovery: parseInt(finishedGamesWithoutVideos.rows[0].count, 10),
    },
    quota: {
      youtube: {
        used: quota.used,
        remaining: quota.remaining,
        limit: quota.limit,
        percentUsed: ((quota.used / quota.limit) * 100).toFixed(1),
      },
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
```

### External Monitoring Setup

**Option 1: UptimeRobot (Free)**

1. Sign up at https://uptimerobot.com
2. Create monitors:
   - **Frontend**: HTTP(s) monitor for your Vercel URL
   - **Backend Health**: HTTP(s) monitor for /health endpoint
   - **Backend Ready**: HTTP(s) monitor for /health/ready endpoint

3. Configure alerts:
   - Email notifications
   - Optional: Slack/Discord webhooks

**Option 2: Better Uptime**

1. Sign up at https://betteruptime.com
2. Similar monitor configuration
3. More advanced incident management

### Monitoring Configuration Doc

```markdown
# Monitoring Configuration

## Endpoints to Monitor

| Endpoint | Check Type | Interval | Alert Threshold |
|----------|------------|----------|-----------------|
| / (frontend) | HTTP 200 | 5 min | 2 failures |
| /health | HTTP 200, JSON status=healthy | 5 min | 2 failures |
| /health/ready | HTTP 200 | 1 min | 1 failure |

## Alert Recipients
- Primary: [your-email@example.com]
- Slack: [#alerts channel webhook]

## Expected Response Times
- Frontend: < 3 seconds
- Health check: < 1 second
- API endpoints: < 500ms

## Escalation
1. First alert: Email notification
2. 15 min unresolved: SMS (if configured)
3. 30 min unresolved: Phone call (if configured)
```

### Status Page (Optional)

For public status communication, consider:
- **Atlassian Statuspage**: Full-featured, paid
- **Cachet**: Self-hosted, open source
- **Instatus**: Simple, free tier available

### Vercel/Railway Built-in Monitoring

Both platforms provide:
- Deployment logs
- Function execution logs
- Basic analytics
- Error tracking

Access via respective dashboards.

## Acceptance Criteria
- [ ] /health returns detailed status
- [ ] /health/live returns simple 200 OK
- [ ] /health/ready checks database
- [ ] Status degrades appropriately when issues occur
- [ ] External monitoring configured and alerting
- [ ] Email alerts received on downtime test
- [ ] Quota warnings visible in health check

## Technical Notes
- Use /health/live for load balancer health checks
- Use /health/ready for readiness probes
- Main /health for detailed debugging
- Consider caching expensive checks

## Estimated Complexity
Medium - Health checks with external service setup

## Dependencies
- Task `phase-7/001-logging-observability`
