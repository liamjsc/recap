# Task: Deploy Backend to Vercel/Railway

## Task ID
`phase-6/002-backend-deployment`

## Description
Deploy the Express backend API with database connectivity and cron job support.

## Prerequisites
- `phase-4/003-job-monitoring-resilience` completed
- Neon database provisioned
- YouTube API key configured

## Expected Outcomes
1. Backend API deployed and accessible
2. Database connection working in production
3. Scheduled jobs running
4. Environment variables configured
5. Health check endpoint functional

## Deliverables

### Option A: Vercel Serverless Functions

**Backend restructure for Vercel:**
```
backend/
├── api/
│   ├── index.ts           # Main API entry (catch-all)
│   ├── health.ts          # GET /api/health
│   └── cron/
│       ├── schedule-sync.ts
│       └── video-discovery.ts
├── src/
│   ├── ... (existing code)
├── vercel.json
└── package.json
```

**vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.ts"
    }
  ],
  "crons": [
    {
      "path": "/api/cron/schedule-sync",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/video-discovery",
      "schedule": "0 */2 * * *"
    }
  ]
}
```

**API entry point:**
```typescript
// backend/api/index.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app } from '../src/app';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
```

**Cron endpoints:**
```typescript
// backend/api/cron/schedule-sync.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runScheduleSync } from '../../src/jobs/scheduleSync';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret (Vercel adds this header for cron jobs)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await runScheduleSync();
    return res.json(result);
  } catch (error) {
    console.error('Schedule sync failed:', error);
    return res.status(500).json({ error: 'Sync failed' });
  }
}
```

### Option B: Railway (Traditional Server)

**railway.json:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

**Procfile (alternative):**
```
web: npm run start
```

### Environment Variables

**Production `.env` (DO NOT COMMIT):**
```bash
# Server
PORT=3001
NODE_ENV=production

# Database (from Neon)
DATABASE_URL=postgresql://user:password@host.neon.tech:5432/nba_highlights?sslmode=require

# APIs
YOUTUBE_API_KEY=AIza...your-key
NBA_API_URL=https://www.balldontlie.io/api/v1

# Security
ADMIN_API_KEY=generate-secure-random-string
CRON_SECRET=generate-another-secure-string

# CORS
CORS_ORIGINS=https://your-frontend.vercel.app
```

### Database Connection for Serverless

**Update pool configuration:**
```typescript
// backend/src/db/pool.ts

import { Pool, PoolConfig } from 'pg';
import { env } from '../config/env';

const poolConfig: PoolConfig = {
  connectionString: env.databaseUrl,
  ssl: {
    rejectUnauthorized: false, // Required for Neon
  },
  // Serverless-optimized settings
  max: env.nodeEnv === 'production' ? 5 : 20,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
};

export const pool = new Pool(poolConfig);
```

### Build Configuration

**Update package.json:**
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node-dev --respawn src/index.ts",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts",
    "migrate": "node-pg-migrate up",
    "migrate:prod": "DATABASE_URL=$DATABASE_URL node-pg-migrate up"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**tsconfig.json production settings:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Deployment Steps

**For Vercel:**
```bash
# From backend directory
cd backend

# Link to Vercel
vercel link

# Set environment variables
vercel env add DATABASE_URL production
vercel env add YOUTUBE_API_KEY production
vercel env add ADMIN_API_KEY production
vercel env add CRON_SECRET production
vercel env add CORS_ORIGINS production

# Deploy
vercel --prod
```

**For Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to existing project (or create new)
railway link

# Add environment variables in Railway dashboard

# Deploy
railway up
```

### Database Migration

**Run migrations in production:**
```bash
# For Vercel (run locally with prod DB)
DATABASE_URL="your-neon-url" npm run migrate:prod

# For Railway (via Railway CLI)
railway run npm run migrate
```

### Health Check Enhancement

**Add deployment info:**
```typescript
// backend/src/routes/health.ts

router.get('/', async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'unknown';

  try {
    await pool.query('SELECT 1');
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }

  res.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: env.nodeEnv,
    region: process.env.VERCEL_REGION || process.env.RAILWAY_REGION || 'unknown',
    services: {
      database: dbStatus,
    },
    responseTime: Date.now() - startTime,
  });
});
```

## Acceptance Criteria
- [ ] Backend API accessible at public URL
- [ ] Health check returns 200 with database connected
- [ ] All API endpoints respond correctly
- [ ] CORS allows frontend origin
- [ ] Environment variables properly configured
- [ ] Database queries work in production
- [ ] Cron jobs scheduled (Vercel) or running (Railway)
- [ ] Admin endpoints protected
- [ ] SSL/TLS enabled

## Technical Notes
- Vercel serverless has cold start latency
- Railway maintains persistent connections
- Neon requires SSL for connections
- Use connection pooling appropriately for environment

## Estimated Complexity
Medium-High - Production deployment with multiple services

## Dependencies
- Task `phase-4/003-job-monitoring-resilience`
- Neon database (user provides)
- YouTube API key (user provides)

## External Requirements
User must provide:
- Neon database connection string
- YouTube Data API key
- Deployment platform choice (Vercel or Railway)
