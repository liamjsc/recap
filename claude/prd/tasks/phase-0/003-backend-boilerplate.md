# Task: Set Up Backend Boilerplate

## Task ID
`phase-0/003-backend-boilerplate`

## Description
Initialize the Express backend application with TypeScript, configure essential middleware, and establish the basic server structure with route organization.

## Prerequisites
- `phase-0/001-init-repository-structure` completed

## Expected Outcomes
1. Express + TypeScript server fully configured
2. Essential middleware configured (CORS, JSON parsing, logging)
3. Route organization structure established
4. Health check endpoint functional
5. Environment variable handling configured
6. Error handling middleware in place

## Deliverables

### Dependencies to Install
```json
{
  "dependencies": {
    "express": "^4.x",
    "cors": "^2.x",
    "dotenv": "^16.x",
    "helmet": "^7.x"
  },
  "devDependencies": {
    "@types/express": "^4.x",
    "@types/cors": "^2.x",
    "@types/node": "^20.x",
    "ts-node-dev": "^2.x",
    "typescript": "^5.x"
  }
}
```

### File Structure
```
backend/src/
├── index.ts                 # Server entry point
├── app.ts                   # Express app configuration
├── config/
│   └── index.ts             # Environment configuration
├── middleware/
│   ├── errorHandler.ts      # Global error handling
│   └── requestLogger.ts     # Request logging
├── routes/
│   ├── index.ts             # Route aggregator
│   ├── health.ts            # Health check routes
│   └── api/
│       ├── index.ts         # API route aggregator
│       ├── teams.ts         # Team routes (stub)
│       ├── games.ts         # Game routes (stub)
│       └── admin.ts         # Admin routes (stub)
├── services/
│   └── .gitkeep             # Placeholder for services
├── db/
│   └── .gitkeep             # Placeholder for database
└── types/
    └── index.ts             # Shared TypeScript types
```

### Environment Configuration
**`.env.example`:**
```bash
# Server
PORT=3001
NODE_ENV=development

# Database (to be configured later)
DATABASE_URL=

# External APIs (to be configured later)
YOUTUBE_API_KEY=
NBA_API_URL=https://www.balldontlie.io/api/v1

# Admin
ADMIN_API_KEY=
```

### Middleware Requirements

**CORS Configuration:**
- Allow frontend origin (configurable via env)
- Allow credentials if needed
- Expose necessary headers

**Error Handler:**
- Catch all unhandled errors
- Return consistent JSON error format
- Log errors with stack traces in development
- Hide stack traces in production

**Request Logger:**
- Log method, path, status code, response time
- Use structured logging format

### Route Stubs
All API routes should return placeholder responses:
```typescript
// Example stub response
res.json({ message: 'Endpoint not yet implemented', endpoint: '/api/teams' });
```

### Health Check Endpoint
**GET `/health`**
```json
{
  "status": "ok",
  "timestamp": "2024-12-14T12:00:00.000Z",
  "version": "1.0.0"
}
```

## Acceptance Criteria
- [ ] `npm run dev` starts server on port 3001 with hot reload
- [ ] `GET /health` returns 200 with status JSON
- [ ] `GET /api/teams` returns stub response
- [ ] CORS allows requests from localhost:5173
- [ ] Invalid routes return 404 JSON response
- [ ] Errors return consistent JSON format
- [ ] Environment variables load from `.env`
- [ ] No TypeScript errors

## Technical Notes
- Use `express.json()` for body parsing
- Use `helmet` for security headers
- Separate app configuration from server startup (for testing)
- Use async route handlers with proper error forwarding
- Consider using `express-async-errors` for cleaner async handling

## Estimated Complexity
Low-Medium - Standard Express setup

## Dependencies
- Task `001-init-repository-structure`
