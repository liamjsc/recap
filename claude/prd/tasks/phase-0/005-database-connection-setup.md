# Task: Set Up Database Connection

## Task ID
`phase-0/005-database-connection-setup`

## Description
Configure PostgreSQL database connection with proper connection pooling, type safety, and local development support.

## Prerequisites
- `phase-0/003-backend-boilerplate` completed
- `phase-0/004-environment-variables-setup` completed
- PostgreSQL database provisioned (Neon or local)

## Expected Outcomes
1. Database client configured with connection pooling
2. Connection test utility available
3. Local development database setup documented
4. Health check includes database connectivity

## Deliverables

### Dependencies to Install
```json
{
  "dependencies": {
    "pg": "^8.x",
    "pg-pool": "^3.x"
  },
  "devDependencies": {
    "@types/pg": "^8.x"
  }
}
```

### File Structure
```
backend/src/db/
├── index.ts          # Database client export
├── pool.ts           # Connection pool configuration
├── test-connection.ts # Connection test utility
└── types.ts          # Database-specific types
```

### Connection Pool Configuration

**`backend/src/db/pool.ts`:**
```typescript
import { Pool, PoolConfig } from 'pg';
import { env } from '../config/env';

const poolConfig: PoolConfig = {
  connectionString: env.databaseUrl,
  max: 20,                    // Maximum connections in pool
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Fail fast if can't connect
  ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: false } : undefined,
};

export const pool = new Pool(poolConfig);

// Log pool errors (don't crash)
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});
```

### Database Client Interface

**`backend/src/db/index.ts`:**
```typescript
import { pool } from './pool';
import { QueryResult, QueryResultRow } from 'pg';

export const db = {
  query: <T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> => {
    return pool.query(text, params);
  },

  getClient: () => pool.connect(),

  end: () => pool.end(),
};

export { pool };
```

### Connection Test Utility

**`backend/src/db/test-connection.ts`:**
```typescript
import { pool } from './pool';

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connected:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
```

### Updated Health Check

**Update `backend/src/routes/health.ts`:**
```typescript
import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/', async (req, res) => {
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
    services: {
      database: dbStatus,
    },
  });
});

export default router;
```

### Local Development Setup

**Option A: Docker (recommended)**

**`docker-compose.yml`:**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: nba_highlights
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Local connection string:**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nba_highlights
```

**Option B: Local PostgreSQL**
- Install PostgreSQL locally
- Create database: `createdb nba_highlights`
- Connection string: `postgresql://localhost:5432/nba_highlights`

### NPM Scripts

Add to `backend/package.json`:
```json
{
  "scripts": {
    "db:test": "ts-node src/db/test-connection.ts",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down"
  }
}
```

## Acceptance Criteria
- [ ] `npm run db:test` successfully connects to database
- [ ] `GET /health` shows database status
- [ ] Connection pool limits are respected
- [ ] SSL works for production (Neon) connections
- [ ] Local development setup documented
- [ ] Pool errors are logged but don't crash server

## Technical Notes
- Neon requires SSL connections
- Use connection pooling for efficient resource usage
- Never expose connection strings in logs
- Test both local and Neon connections
- Consider using `pg-native` for better performance (optional)

## Estimated Complexity
Medium - Database configuration with SSL and pooling

## Dependencies
- Task `003-backend-boilerplate`
- Task `004-environment-variables-setup`
- Neon database provisioned (external)

## External Requirements
User must provide:
- Neon connection string (or other PostgreSQL provider)
- OR local PostgreSQL installation
