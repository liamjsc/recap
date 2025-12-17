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
│   │   ├── config/      # Environment validation
│   │   ├── db/          # Database pool, queries, seeds, repositories
│   │   ├── middleware/  # Request logging, error handling
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # YouTube, NBA, video discovery, schedule sync
│   │   ├── scripts/     # CLI scripts for sync operations
│   │   └── types/       # TypeScript interfaces
│   └── migrations/      # node-pg-migrate files
└── claude/prd/tasks/    # Implementation task definitions
```

## Key Commands

### Backend
```bash
cd backend
npm run dev             # Start dev server (ts-node-dev)
npm run build           # Compile TypeScript
npm run typecheck       # Type checking only
npm run migrate         # Run migrations up
npm run migrate:down    # Rollback migration
npm run db:seed         # Seed NBA teams
npm run db:test         # Test database connection
npm run sync:schedule   # Sync NBA schedule (upcoming week)
npm run sync:videos     # Discover highlight videos (limit: 10)
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
1. **teams** - 30 NBA teams with conference/division (seeded)
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
DATABASE_URL=postgresql://...           # Neon connection string (configured)
ADMIN_API_KEY=dev-admin-key-12345      # For admin endpoints
YOUTUBE_API_KEY=AIzaSy...              # YouTube Data API v3 (configured)
NBA_API_URL=https://www.balldontlie.io/api/v1
CORS_ORIGINS=http://localhost:5173
LOG_LEVEL=debug
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
VITE_ENABLE_EMBED=true
```

## API Endpoints

### Public API
- `GET /health` - Health check with DB status
- `GET /api/teams` - List all 30 NBA teams
- `GET /api/teams/:id` - Single team details
- `GET /api/teams/abbr/:abbreviation` - Team by abbreviation
- `GET /api/teams/:id/games` - Games for a team
- `GET /api/games?date=YYYY-MM-DD` - Games by date
- `GET /api/games?startDate=X&endDate=Y` - Games by date range
- `GET /api/games/:id` - Single game with video

### Admin API (requires X-Admin-API-Key header)
- `GET /api/admin/health` - Database stats and service status
- `POST /api/admin/sync/schedule` - Sync game schedules (body: {range: 'today'|'yesterday'|'upcoming'})
- `POST /api/admin/sync/scores` - Update live scores
- `POST /api/admin/sync/videos` - Discover videos (body: {scope: 'recent'|'yesterday', limit: 20})
- `POST /api/admin/sync/videos/:gameId` - Discover video for specific game
- `POST /api/admin/refresh/video-stats` - Refresh video view counts

## Services & Repositories

### Repositories (src/db/repositories/)
- **teamsRepository** - CRUD for teams, findByConference, findByAbbreviation
- **gamesRepository** - findByDateRange, findByTeamId, findByStatus, CRUD
- **videosRepository** - findByGameId, findByYoutubeVideoId, findVerified, CRUD

### Services (src/services/)
- **youtubeService** - Search highlights, get video details, verify channels, parse duration
- **nbaService** - Fetch schedules from balldontlie.io, get games by date/team
- **videoDiscoveryService** - Auto-discover and save highlight videos for finished games
- **scheduleSyncService** - Sync NBA schedules, update scores, manage game data

## Implementation Progress

### ✅ Completed
- [x] **Phase 0**: Infrastructure setup (monorepo, boilerplate, env config, DB connection)
- [x] **Phase 1**: Database foundation (migrations, seeds, repositories)
  - 4 migrations created and run
  - 30 NBA teams seeded
  - Full repository layer with CRUD operations
- [x] **Phase 2**: Backend API routes
  - Teams API (list, get by ID, get by abbreviation, get games)
  - Games API (by date, date range, with videos)
  - All endpoints tested and working
- [x] **Phase 3**: External API integrations
  - YouTube Data API v3 client implemented
  - NBA schedule API client (balldontlie.io)
  - Video discovery service with verified channel detection
  - Schedule sync service with date range support
  - Admin endpoints for all sync operations
- [x] **Phase 4**: Automated cron jobs (SKIPPED - using manual sync scripts)
- [x] **Phase 5**: Frontend UI implementation
  - HomePage with team grid and date picker
  - TeamPage with game list and video thumbnails
  - DatePage with game list and date navigation
  - Layout with header navigation, mobile menu, team search
  - User preferences (localStorage) for recent teams

### 🚧 In Progress
- [ ] **Phase 6**: Vercel deployment
  - vercel.json configured for frontend
  - Backend needs separate deployment (Railway/Render recommended)
  - Set VITE_API_URL env var to backend URL in Vercel

### ⏳ Pending
- [ ] **Phase 7**: Monitoring & operations

## Current State

### Database
- ✅ 30 NBA teams seeded
- ✅ Ready to receive game data
- ✅ Migrations all applied

### Backend
- ✅ API server running on port 3001
- ✅ All public endpoints functional
- ✅ Admin endpoints secured with API key
- ✅ YouTube API integrated and ready
- ✅ NBA schedule API integrated

### Frontend
- ✅ All pages implemented (Home, Team, Date)
- ✅ Components: Hero, TeamGrid, TeamCard, DatePicker, GameCard, VideoThumbnail
- ✅ Navigation with mobile menu and team search
- ✅ User preferences stored in localStorage

## Quick Start for New Agents

1. **Sync game data**: `cd backend && npm run sync:schedule`
2. **Discover videos**: `cd backend && npm run sync:videos`
3. **Test APIs**:
   - `curl http://localhost:3001/api/teams`
   - `curl http://localhost:3001/api/games?date=2024-12-15`
4. **Start dev servers**:
   - Backend: `cd backend && npm run dev`
   - Frontend: `cd frontend && npm run dev`

## Task Definitions
Detailed task breakdowns are in `./claude/prd/tasks/phase-X/###-task_slug.md`

## Notes for Agents
- Database uses snake_case columns, API responses use camelCase
- Neon requires SSL (`ssl: { rejectUnauthorized: false }`)
- Frontend Vite proxy forwards `/api` to backend in dev
- Use repositories from `src/db/repositories` for all database operations
- Admin routes require `X-Admin-API-Key` header matching `ADMIN_API_KEY` env var
- YouTube API key is configured and working
- balldontlie.io requires no authentication

## Code Style Preferences
- **Prefer functional patterns over imperative loops**: Use `.forEach()`, `.map()`, `.filter()`, `.reduce()` instead of `for...of` or `for` loops
- API responses return arrays directly (e.g., `GET /api/teams` returns `Team[]`, not `{ teams: Team[] }`)
