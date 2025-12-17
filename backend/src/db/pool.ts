import { Pool, PoolConfig } from 'pg';
import { env } from '../config/env';

const isProduction = env.nodeEnv === 'production';

const poolConfig: PoolConfig = {
  connectionString: env.databaseUrl,

  // SSL required for Neon
  ssl: {
    rejectUnauthorized: false,
  },

  // Connection pool settings
  min: 2,
  max: isProduction ? 10 : 5,

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
  pool.on('connect', () => console.log('📦 Pool: New client connected'));
  pool.on('remove', () => console.log('📦 Pool: Client removed'));
}

pool.on('error', (err) => {
  console.error('❌ Unexpected pool error:', err);
});

export async function closePool(): Promise<void> {
  await pool.end();
}
