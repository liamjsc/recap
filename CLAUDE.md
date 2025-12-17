# NBA Highlights Aggregator - Agent Context

## Project Overview
A web application that aggregates NBA game highlight videos from YouTube, allowing users to browse games by date or team and watch embedded highlights.

## Architecture
- **Frontend**: React + Vite + TypeScript + Tailwind CSS (port 5173)
- **Backend**: Express + TypeScript (port 3001)
- **Database**: PostgreSQL on Neon (serverless)
- **External APIs**: YouTube Data API v3, balldontlie.io (NBA schedule)

## Directory Structure
```
recap/
├── frontend/           # React SPA
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── api/
│       └── types/
├── backend/            # Express API
│   ├── src/
│   │   ├── config/     # Environment validation
│   │   ├── db/         # Database pool, queries, seeds
│   │   ├── middleware/ # Request logging, error handling
│   │   ├── routes/     # API endpoints
│   │   └── types/      # TypeScript interfaces
│   └── migrations/     # node-pg-migrate files
└── claude/prd/tasks/   # Implementation task definitions
```

## Key Commands

### Backend
```bash
cd backend
npm run dev          # Start dev server (ts-node-dev)
npm run build        # Compile TypeScript
npm run typecheck    # Type checking only
npm run migrate      # Run migrations up
npm run migrate:down # Rollback migration
npm run db:seed      # Seed NBA teams
npm run db:test      # Test database connection
```

### Frontend
```bash
cd frontend
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run typecheck    # Type checking only
```

## Database Schema

### Tables (in migration order)
1. **teams** - 30 NBA teams with conference/division
2. **games** - Game schedule with foreign keys to teams
3. **videos** - YouTube highlight videos linked to games (1:1)
4. **job_history** - Cron job execution logs

### Key Constraints
- `games.home_team_id != games.away_team_id`
- `games.status IN ('scheduled', 'in_progress', 'finished')`
- `teams.conference IN ('Western', 'Eastern')`
- `videos.game_id` is unique (one video per game)
- `videos.duration_seconds > 0`

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://...  # Neon connection string
ADMIN_API_KEY=...              # For admin endpoints
YOUTUBE_API_KEY=...            # YouTube Data API v3
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
VITE_ENABLE_EMBED=true
```

## API Endpoints

### Public
- `GET /health` - Health check with DB status
- `GET /api/teams` - List all teams
- `GET /api/teams/:id` - Single team with games
- `GET /api/games` - Games by date range
- `GET /api/games/:id` - Single game with video

### Admin (requires X-Admin-Key header)
- `POST /api/admin/sync/schedule` - Trigger schedule sync
- `POST /api/admin/sync/videos` - Trigger video discovery
- `GET /api/admin/jobs` - View job history

## Implementation Progress

### Completed
- [x] Phase 0: Infrastructure setup (monorepo, boilerplate, env config, DB connection)
- [x] Phase 1 partial: Migrations created, teams seeded (30 teams)

### In Progress
- [ ] Phase 1: Repository layer (teams, games, videos CRUD)

### Pending
- [ ] Phase 2: Backend API routes implementation
- [ ] Phase 3: External API integrations (YouTube, NBA schedule)
- [ ] Phase 4: Automated cron jobs
- [ ] Phase 5: Frontend UI components
- [ ] Phase 6: Vercel deployment
- [ ] Phase 7: Monitoring & operations

## Task Definitions
Detailed task breakdowns are in `./claude/prd/tasks/phase-X/###-task_slug.md`

## Notes for Agents
- The database uses snake_case columns, API responses use camelCase
- Neon requires SSL (`ssl: { rejectUnauthorized: false }`)
- Frontend Vite proxy forwards `/api` to backend in dev
- Use `db.query()` from `src/db/index.ts` for database operations
- Admin routes require `X-Admin-Key` header matching `ADMIN_API_KEY` env var
