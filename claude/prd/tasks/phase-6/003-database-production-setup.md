# Task: Configure Production Database (Neon)

## Task ID
`phase-6/003-database-production-setup`

## Description
Set up and configure the Neon PostgreSQL database for production use, including running migrations and seeding initial data.

## Prerequisites
- `phase-1/006-database-query-helpers` completed
- Neon account created

## Expected Outcomes
1. Production database created on Neon
2. All migrations applied
3. Teams data seeded
4. Connection pooling configured
5. Backup schedule understood

## Deliverables

### Neon Project Setup

1. **Create Neon Project**
   - Go to https://neon.tech
   - Create new project
   - Name: `nba-highlights` or similar
   - Region: Choose closest to deployment (e.g., US East)
   - PostgreSQL version: 16 (latest)

2. **Get Connection String**
   ```
   postgresql://[user]:[password]@[host].neon.tech/[database]?sslmode=require
   ```

3. **Create Branch for Development (Optional)**
   - Main branch: production
   - Dev branch: for local development testing

### Connection Configuration

**Update environment config:**
```typescript
// backend/src/config/env.ts

export const env = {
  // ... existing config
  databaseUrl: process.env.DATABASE_URL || '',
  databasePoolMin: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
  databasePoolMax: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
};
```

**Neon-optimized pool:**
```typescript
// backend/src/db/pool.ts

import { Pool, PoolConfig } from 'pg';
import { env } from '../config/env';

const isProduction = env.nodeEnv === 'production';

const poolConfig: PoolConfig = {
  connectionString: env.databaseUrl,

  // SSL required for Neon
  ssl: isProduction ? { rejectUnauthorized: false } : undefined,

  // Connection pool settings
  min: env.databasePoolMin,
  max: env.databasePoolMax,

  // Timeouts (important for serverless)
  idleTimeoutMillis: isProduction ? 10000 : 30000,
  connectionTimeoutMillis: isProduction ? 5000 : 10000,

  // Keep connections alive
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
};

export const pool = new Pool(poolConfig);

// Log pool events in development
if (!isProduction) {
  pool.on('connect', () => console.log('Pool: New client connected'));
  pool.on('remove', () => console.log('Pool: Client removed'));
}

pool.on('error', (err) => {
  console.error('Unexpected pool error:', err);
});
```

### Migration Script for Production

**`backend/scripts/migrate-production.sh`:**
```bash
#!/bin/bash

set -e

echo "🔄 Running production migrations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set"
  exit 1
fi

# Run migrations
npx node-pg-migrate up

echo "✅ Migrations completed successfully"
```

**`backend/scripts/seed-production.sh`:**
```bash
#!/bin/bash

set -e

echo "🌱 Seeding production database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set"
  exit 1
fi

# Run seed
npx ts-node src/db/seed.ts

echo "✅ Seeding completed successfully"
```

### Initial Setup Commands

```bash
# From backend directory

# 1. Set environment variable (temporary)
export DATABASE_URL="postgresql://user:pass@host.neon.tech/db?sslmode=require"

# 2. Run migrations
npm run migrate

# 3. Seed teams
npm run db:seed

# 4. Verify (using psql or Neon console)
psql $DATABASE_URL -c "SELECT COUNT(*) FROM teams;"
# Should return: 30

# 5. Initial schedule sync (optional)
curl -X POST http://localhost:3001/api/admin/fetch-schedule \
  -H "X-Admin-API-Key: your-admin-key"
```

### Database Verification Script

```typescript
// backend/scripts/verify-database.ts

import { pool } from '../src/db/pool';

async function verifyDatabase() {
  console.log('🔍 Verifying database setup...\n');

  try {
    // Check connection
    console.log('1. Testing connection...');
    await pool.query('SELECT NOW()');
    console.log('   ✅ Connected successfully\n');

    // Check tables
    console.log('2. Checking tables...');
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    const tableNames = tables.rows.map((r) => r.table_name);
    console.log('   Tables:', tableNames.join(', '));

    const expected = ['games', 'job_history', 'pgmigrations', 'teams', 'videos'];
    const missing = expected.filter((t) => !tableNames.includes(t));
    if (missing.length > 0) {
      console.log(`   ⚠️  Missing tables: ${missing.join(', ')}\n`);
    } else {
      console.log('   ✅ All expected tables exist\n');
    }

    // Check teams count
    console.log('3. Checking teams data...');
    const teamCount = await pool.query('SELECT COUNT(*) as count FROM teams');
    console.log(`   Teams count: ${teamCount.rows[0].count}`);
    if (teamCount.rows[0].count === '30') {
      console.log('   ✅ All 30 teams seeded\n');
    } else {
      console.log('   ⚠️  Expected 30 teams\n');
    }

    // Check indexes
    console.log('4. Checking indexes...');
    const indexes = await pool.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    console.log(`   Found ${indexes.rows.length} indexes`);
    console.log('   ✅ Indexes present\n');

    console.log('✅ Database verification complete!');
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyDatabase();
```

### Neon Dashboard Configuration

1. **Connection Pooling**
   - Neon provides built-in connection pooling
   - Use pooled connection string for serverless
   - Use direct connection for migrations

2. **Branches** (optional)
   - Create `development` branch for testing
   - Main branch for production
   - Branches share schema but isolated data

3. **Monitoring**
   - Enable query statistics
   - Set up usage alerts
   - Monitor connection count

4. **Backups**
   - Neon provides automatic PITR (Point-in-Time Recovery)
   - Configure retention period if needed

### Environment Variables Summary

```bash
# Production Database
DATABASE_URL=postgresql://user:pass@host.neon.tech/nba_highlights?sslmode=require

# Pooled Connection (for serverless)
DATABASE_URL_POOLED=postgresql://user:pass@host-pooler.neon.tech/nba_highlights?sslmode=require

# Pool Settings
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

## Acceptance Criteria
- [ ] Neon project created
- [ ] Connection string obtained and tested
- [ ] All migrations run successfully
- [ ] 30 teams seeded
- [ ] Indexes created
- [ ] Connection pooling configured
- [ ] Backend can connect from deployment platform
- [ ] Verification script passes

## Technical Notes
- Use pooled connection string for Vercel serverless
- Use direct connection for migrations
- SSL required (`sslmode=require`)
- Neon has automatic scaling and branching

## Estimated Complexity
Medium - Database setup with migration

## Dependencies
- Task `phase-1/006-database-query-helpers`

## External Requirements
User must provide:
- Neon account (free tier available)
