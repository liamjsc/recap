import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface EnvConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  databaseUrl: string;
  youtubeApiKey: string;
  nbaApiUrl: string;
  nbaApiKey: string;
  adminApiKey: string;
  corsOrigins: string[];
  logLevel: string;
}

function getEnvString(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Invalid number for environment variable: ${key}`);
  }
  return parsed;
}

function validateEnv(): EnvConfig {
  const nodeEnv = getEnvString('NODE_ENV', 'development') as EnvConfig['nodeEnv'];

  // Only require these in production
  const requiredInProd = ['DATABASE_URL', 'YOUTUBE_API_KEY', 'ADMIN_API_KEY'];
  if (nodeEnv === 'production') {
    const missing = requiredInProd.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  return {
    port: getEnvNumber('PORT', 3001),
    nodeEnv,
    databaseUrl: getEnvString('DATABASE_URL', ''),
    youtubeApiKey: getEnvString('YOUTUBE_API_KEY', ''),
    nbaApiUrl: getEnvString('NBA_API_URL', 'https://api.balldontlie.io/v1'),
    nbaApiKey: getEnvString('NBA_API_KEY', ''),
    adminApiKey: getEnvString('ADMIN_API_KEY', 'dev-admin-key'),
    corsOrigins: getEnvString('CORS_ORIGINS', 'http://localhost:5173').split(','),
    logLevel: getEnvString('LOG_LEVEL', 'debug'),
  };
}

export const env = validateEnv();
