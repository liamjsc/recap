# Task: Configure Environment Variables

## Task ID
`phase-0/004-environment-variables-setup`

## Description
Establish a comprehensive environment variable system for both frontend and backend, including documentation, validation, and type safety.

## Prerequisites
- `phase-0/002-frontend-boilerplate` completed
- `phase-0/003-backend-boilerplate` completed

## Expected Outcomes
1. Complete `.env.example` files for both frontend and backend
2. Type-safe environment variable access
3. Validation that required variables are present
4. Documentation of all environment variables

## Deliverables

### Backend Environment Variables

**`backend/.env.example`:**
```bash
# ===========================================
# Server Configuration
# ===========================================
PORT=3001
NODE_ENV=development

# ===========================================
# Database
# ===========================================
# PostgreSQL connection string
# Format: postgresql://user:password@host:port/database?sslmode=require
DATABASE_URL=postgresql://localhost:5432/nba_highlights

# ===========================================
# External APIs
# ===========================================
# YouTube Data API v3 key (from Google Cloud Console)
YOUTUBE_API_KEY=

# NBA Schedule API base URL
NBA_API_URL=https://www.balldontlie.io/api/v1

# ===========================================
# Security
# ===========================================
# API key for admin endpoints (generate a secure random string)
ADMIN_API_KEY=

# Frontend URL for CORS (comma-separated for multiple origins)
CORS_ORIGINS=http://localhost:5173

# ===========================================
# Optional: Logging
# ===========================================
LOG_LEVEL=debug
```

**`backend/src/config/env.ts`:**
```typescript
// Type-safe environment configuration with validation
interface EnvConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  databaseUrl: string;
  youtubeApiKey: string;
  nbaApiUrl: string;
  adminApiKey: string;
  corsOrigins: string[];
  logLevel: string;
}

function validateEnv(): EnvConfig {
  const required = ['DATABASE_URL', 'YOUTUBE_API_KEY', 'ADMIN_API_KEY'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: (process.env.NODE_ENV as EnvConfig['nodeEnv']) || 'development',
    databaseUrl: process.env.DATABASE_URL || '',
    youtubeApiKey: process.env.YOUTUBE_API_KEY || '',
    nbaApiUrl: process.env.NBA_API_URL || 'https://www.balldontlie.io/api/v1',
    adminApiKey: process.env.ADMIN_API_KEY || 'dev-admin-key',
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
    logLevel: process.env.LOG_LEVEL || 'debug',
  };
}

export const env = validateEnv();
```

### Frontend Environment Variables

**`frontend/.env.example`:**
```bash
# ===========================================
# API Configuration
# ===========================================
# Backend API URL
VITE_API_URL=http://localhost:3001/api

# ===========================================
# Feature Flags (optional)
# ===========================================
# Enable embedded YouTube player (vs link-out)
VITE_ENABLE_EMBED=false
```

**`frontend/src/config/env.ts`:**
```typescript
interface EnvConfig {
  apiUrl: string;
  enableEmbed: boolean;
}

export const env: EnvConfig = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  enableEmbed: import.meta.env.VITE_ENABLE_EMBED === 'true',
};
```

### Documentation

**`docs/ENVIRONMENT.md`** (or section in README):
```markdown
# Environment Variables

## Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 3001 | Server port |
| NODE_ENV | No | development | Environment mode |
| DATABASE_URL | Yes* | - | PostgreSQL connection string |
| YOUTUBE_API_KEY | Yes* | - | YouTube Data API v3 key |
| NBA_API_URL | No | balldontlie.io | NBA schedule API |
| ADMIN_API_KEY | Yes* | - | Admin endpoint authentication |
| CORS_ORIGINS | No | localhost:5173 | Allowed CORS origins |
| LOG_LEVEL | No | debug | Logging verbosity |

*Required in production

## Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| VITE_API_URL | No | localhost:3001/api | Backend API URL |
| VITE_ENABLE_EMBED | No | false | Enable YouTube embeds |
```

## Acceptance Criteria
- [ ] `.env.example` files exist in both frontend and backend
- [ ] Copying `.env.example` to `.env` allows app to start
- [ ] Backend validates required variables on startup
- [ ] Backend throws clear error if required var missing in production
- [ ] Frontend env variables accessible via typed config
- [ ] Documentation explains all variables
- [ ] Actual `.env` files are gitignored

## Technical Notes
- Use `dotenv` package in backend (load early in entry point)
- Vite automatically loads `VITE_*` prefixed variables
- Never log sensitive values (API keys, database URLs)
- Consider using `zod` for more robust validation (optional)

## Estimated Complexity
Low - Configuration setup

## Dependencies
- Task `002-frontend-boilerplate`
- Task `003-backend-boilerplate`
