# Technical Implementation Plan
## NBA Highlights Aggregator

This document outlines the technical checkpoints required to build and launch the NBA Highlights Aggregator application. Each phase defines expected outcomes, deliverables, and success criteria.

---

## Phase 0: Infrastructure & Environment Setup

### Checkpoint 0.1: Development Environment
**Expected Outcomes:**
- Project repository initialized with proper structure
- Monorepo or separate frontend/backend directories established
- Git hooks and basic linting configured
- README with setup instructions

**Deliverables:**
- `/frontend` - React application root
- `/backend` - Node.js/Express API root
- `.gitignore` properly configured
- `package.json` files with scripts for dev, build, start

**Success Criteria:**
- `npm install` succeeds in both directories
- `npm run dev` starts both frontend and backend locally
- Code can be committed and pushed to repository

---

### Checkpoint 0.2: External Service Accounts
**Expected Outcomes:**
- All required external service accounts created and accessible
- API keys generated and documented (not committed)

**Required Accounts:**
| Service | Purpose | Action Required |
|---------|---------|-----------------|
| Google Cloud Console | YouTube Data API v3 | Create project, enable API, generate API key |
| Vercel | Frontend hosting | Create account, link to repository |
| Neon (or alternative) | PostgreSQL database | Create account, provision database |

**Deliverables:**
- `.env.example` files with all required environment variables
- Documentation for obtaining each API key
- Quota alerts configured for YouTube API

**Success Criteria:**
- YouTube API key can make test queries
- Database connection string works locally
- Vercel CLI authenticated

---

### Checkpoint 0.3: Database Provisioning
**Expected Outcomes:**
- Production PostgreSQL database provisioned and accessible
- Connection pooling configured
- Local development database setup documented

**Deliverables:**
- Production database URL
- Development database setup (local PostgreSQL or Docker)
- Connection test script

**Success Criteria:**
- Can connect to production database from local machine
- Can connect from Vercel/hosting environment
- SSL/TLS properly configured

---

## Phase 1: Database Schema & Foundation

### Checkpoint 1.1: Schema Design & Migrations
**Expected Outcomes:**
- Complete database schema implemented
- Migration system in place for versioned schema changes
- Rollback capability established

**Tables Required:**
```
teams
├── id (PK)
├── name
├── full_name
├── abbreviation
├── conference
├── division
├── external_id
├── created_at
└── updated_at

games
├── id (PK)
├── external_id (unique)
├── game_date
├── game_time
├── home_team_id (FK → teams)
├── away_team_id (FK → teams)
├── status (scheduled | in_progress | finished)
├── home_score
├── away_score
├── created_at
└── updated_at

videos
├── id (PK)
├── game_id (FK → games, unique)
├── youtube_video_id (unique)
├── title
├── channel_name
├── channel_id
├── duration_seconds
├── thumbnail_url
├── published_at
├── view_count
├── url
├── is_verified
├── created_at
└── updated_at
```

**Indexes Required:**
- `games.game_date` - Date-based queries
- `games.home_team_id` - Team page queries
- `games.away_team_id` - Team page queries
- `games.status` - Finding games needing video search
- `videos.game_id` - Video lookups

**Deliverables:**
- Migration files for all tables
- Index creation migrations
- Seed file for NBA teams (30 teams with full metadata)

**Success Criteria:**
- All migrations run without errors
- Rollback migrations work correctly
- Teams seed populates all 30 NBA teams
- Foreign key constraints enforced

---

### Checkpoint 1.2: Database Access Layer
**Expected Outcomes:**
- Type-safe database client configured
- Query builders or ORM integrated
- Connection pooling properly configured

**Deliverables:**
- Database client module (`/backend/src/db/`)
- Type definitions for all tables
- Query helper functions for common operations

**Success Criteria:**
- Can perform CRUD operations on all tables
- Proper error handling for database failures
- Connection pool limits respected

---

## Phase 2: Backend API Foundation

### Checkpoint 2.1: Express Server Setup
**Expected Outcomes:**
- Express server configured with proper middleware
- Error handling middleware in place
- Request logging configured
- CORS configured for frontend origin

**Deliverables:**
- Server entry point (`/backend/src/index.ts`)
- Middleware configuration
- Route organization structure
- Health check endpoint (`GET /health`)

**Success Criteria:**
- Server starts and accepts requests
- Health check returns 200 OK
- Errors return proper JSON responses
- CORS allows frontend requests

---

### Checkpoint 2.2: Public API Endpoints
**Expected Outcomes:**
- All public API endpoints implemented and functional
- Proper validation on all inputs
- Consistent response formats

**Endpoints Required:**

| Method | Path | Description | Response |
|--------|------|-------------|----------|
| GET | `/api/teams` | List all NBA teams | `{ teams: Team[] }` |
| GET | `/api/teams/:id` | Get single team | `{ team: Team }` |
| GET | `/api/teams/:id/games` | Get team's recent games with videos | `{ games: GameWithVideo[] }` |
| GET | `/api/games/date/:date` | Get all games on a date | `{ games: GameWithVideo[] }` |
| GET | `/api/games/:id` | Get single game with video | `{ game: Game, video: Video \| null }` |

**Query Parameters:**
- `/api/teams/:id/games?limit=10` - Limit results (default 10, max 50)
- `/api/games/date/:date` - Date format: YYYY-MM-DD

**Deliverables:**
- Route handlers for all endpoints
- Input validation middleware
- Response type definitions
- Error responses for invalid inputs (400), not found (404)

**Success Criteria:**
- All endpoints return correct data structure
- Invalid inputs return 400 with helpful messages
- Non-existent resources return 404
- Response times under 200ms for typical queries

---

### Checkpoint 2.3: Admin API Endpoints
**Expected Outcomes:**
- Administrative endpoints for manual operations
- Basic protection against accidental public use

**Endpoints Required:**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/fetch-schedule` | Trigger schedule sync |
| POST | `/api/admin/fetch-videos` | Search videos for all pending games |
| POST | `/api/admin/fetch-video/:gameId` | Search video for specific game |

**Deliverables:**
- Admin route handlers
- Simple API key authentication for admin routes
- Response includes operation results (counts, success/failure)

**Success Criteria:**
- Admin endpoints reject requests without valid key
- Operations complete and return meaningful results
- Failed operations return error details

---

## Phase 3: External API Integrations

### Checkpoint 3.1: NBA Schedule API Integration
**Expected Outcomes:**
- Service module that fetches NBA schedule data
- Reliable parsing of external API responses
- Error handling for API failures

**Functionality:**
- Fetch games for a date range
- Parse response into internal Game format
- Handle API rate limits gracefully
- Support multiple API sources as fallback

**Primary API:** balldontlie.io or ESPN API

**Deliverables:**
- Schedule service module (`/backend/src/services/schedule.ts`)
- Type definitions for external API responses
- Mapping functions (external → internal format)
- Retry logic for failed requests

**Success Criteria:**
- Can fetch today's games successfully
- Can fetch games for arbitrary date range
- Handles API errors without crashing
- Correctly maps external team IDs to internal team IDs

---

### Checkpoint 3.2: YouTube Data API Integration
**Expected Outcomes:**
- Service module for YouTube video search
- Efficient quota usage through proper query construction
- Reliable video matching for games

**Functionality:**
- Search for videos matching a game
- Retrieve video details (duration, view count)
- Filter results by channel, duration, upload date
- Return best matching video

**Search Strategy:**
```
Query: "{AWAY_TEAM} at {HOME_TEAM} FULL GAME HIGHLIGHTS {Month} {Day} {Year}"
Filters:
- Channel: UCnba (NBA official) preferred
- Duration: 10-20 minutes
- Upload date: Within 12 hours of game end
```

**Deliverables:**
- YouTube service module (`/backend/src/services/youtube.ts`)
- Search query builder
- Result filtering and ranking logic
- Quota tracking/logging

**Success Criteria:**
- Can find highlight video for a known game
- Correctly filters out non-highlight videos
- Returns null gracefully when no match found
- Uses minimal API quota per search (~100-200 units)

---

### Checkpoint 3.3: Video Matching Service
**Expected Outcomes:**
- Orchestration layer combining schedule and YouTube services
- Database persistence of discovered videos
- Logging of match success/failure

**Functionality:**
- Query games that need video discovery
- Execute YouTube search for each game
- Validate and store matching videos
- Track games where no video was found (for retry)

**Deliverables:**
- Video matcher service (`/backend/src/services/videoMatcher.ts`)
- Match quality scoring algorithm
- Database update functions
- Failure logging for manual review

**Success Criteria:**
- Successfully matches videos for >85% of finished games
- Does not create duplicate video entries
- Logs clear reasons when matches fail
- Respects YouTube API quota limits

---

## Phase 4: Automated Jobs

### Checkpoint 4.1: Schedule Sync Job
**Expected Outcomes:**
- Automated daily sync of NBA schedule
- New games added, existing games updated
- Game status transitions handled

**Job Specification:**
- Frequency: Once daily at 6:00 AM EST
- Scope: Previous 3 days + Next 7 days
- Actions:
  - Insert new games
  - Update scores for completed games
  - Update status (scheduled → finished)

**Deliverables:**
- Cron job configuration
- Schedule sync function
- Logging of sync results
- Error alerting (optional)

**Success Criteria:**
- Job runs reliably on schedule
- New games appear in database
- Game scores updated after completion
- Job completes within 2 minutes

---

### Checkpoint 4.2: Video Discovery Job
**Expected Outcomes:**
- Automated video search for completed games
- Intelligent timing based on game end times
- Retry logic for initially unfound videos

**Job Specification:**
- Frequency: Every 2 hours
- Scope: Games where status = "finished" AND video = null
- Additional filter: Game ended at least 3 hours ago

**Logic:**
```
1. Query all finished games without videos
2. Filter to games ended >3 hours ago
3. For each game (up to quota limit):
   a. Search YouTube
   b. If match found, store video
   c. If no match, log for retry
4. Mark games that failed 5+ times for manual review
```

**Deliverables:**
- Cron job configuration
- Video discovery function with quota awareness
- Retry tracking mechanism
- Daily quota usage logging

**Success Criteria:**
- Discovers videos within 6 hours of game end (>90% of games)
- Does not exceed YouTube API quota
- Retries appropriately for delayed uploads
- Provides visibility into discovery success rate

---

### Checkpoint 4.3: Job Monitoring & Resilience
**Expected Outcomes:**
- Visibility into job execution status
- Automatic recovery from failures
- Alerting for critical issues

**Deliverables:**
- Job execution logging (start, end, results)
- Database table or log for job history
- Health check endpoint includes job status
- Error handling that prevents job crashes

**Success Criteria:**
- Can determine when jobs last ran successfully
- Jobs restart automatically after transient failures
- Critical failures logged with sufficient context
- No silent failures

---

## Phase 5: Frontend Application

### Checkpoint 5.1: React Application Setup
**Expected Outcomes:**
- React application bootstrapped with modern tooling
- Routing configured for all pages
- API client configured
- Basic styling system in place

**Deliverables:**
- React + Vite (or CRA) setup
- React Router configuration
- API client module with base URL configuration
- Tailwind CSS or chosen styling solution
- Basic layout component (header, content area)

**Success Criteria:**
- Application runs locally
- Routes navigate correctly
- API calls reach backend
- Responsive layout on mobile/desktop

---

### Checkpoint 5.2: Home Page
**Expected Outcomes:**
- Landing page with clear navigation options
- Team selection interface
- Date selection interface

**Components:**
- Hero/welcome section
- "Browse by Team" section with team grid/list
- "Browse by Date" section with date picker
- Navigation to team and date pages

**Deliverables:**
- Home page component
- Team selector component (shows all 30 teams)
- Date picker component
- Responsive layout

**Success Criteria:**
- All 30 teams displayed and clickable
- Date picker allows any date selection
- Clicking team navigates to `/team/:abbreviation`
- Clicking date navigates to `/date/:YYYY-MM-DD`

---

### Checkpoint 5.3: Team Page
**Expected Outcomes:**
- Display team information and recent games
- Show highlight videos for each game
- Handle games without videos gracefully

**Route:** `/team/:abbreviation`

**Components:**
- Team header (name, logo placeholder)
- Game list (most recent first)
- Game card showing:
  - Date
  - Opponent
  - Score (if available)
  - Video link/embed (if available)
  - "Highlights coming soon" (if no video)

**Deliverables:**
- Team page component
- Game list component
- Game card component
- Video link/thumbnail component
- Loading state
- Empty state (no games found)
- Error state (team not found)

**Success Criteria:**
- Correct team data displayed for any team
- Games load and display correctly
- Videos link to YouTube correctly
- Missing videos show appropriate message
- Invalid team shows 404 message

---

### Checkpoint 5.4: Date Browser Page
**Expected Outcomes:**
- Display all games from a selected date
- Easy navigation between dates
- Show video availability for each game

**Route:** `/date/:YYYY-MM-DD`

**Components:**
- Date header with previous/next navigation
- Date picker for jumping to specific date
- Game list for that date
- Game card (reusable from team page)

**Deliverables:**
- Date page component
- Date navigation component
- Date picker integration
- Game list (grouped by time if desired)

**Success Criteria:**
- Correct games displayed for any valid date
- Previous/next navigation works
- Date picker allows jumping to any date
- Future dates show scheduled games
- Days with no games show appropriate message

---

### Checkpoint 5.5: Video Display & UX
**Expected Outcomes:**
- Consistent video presentation across all pages
- Optimal user experience for watching highlights

**Components:**
- Video thumbnail with play indicator
- Video metadata (duration, upload time, channel)
- Click-through to YouTube (v1)
- Optional: Embedded YouTube player (v1.1)

**Deliverables:**
- Video card component
- Thumbnail loading with fallback
- Duration formatting (MM:SS)
- "Official NBA" badge for verified videos

**Success Criteria:**
- Videos open correctly in new tab
- Thumbnails load quickly with fallback
- Metadata is accurate and readable
- Mobile-friendly touch targets

---

### Checkpoint 5.6: User Experience Polish
**Expected Outcomes:**
- Professional, polished interface
- Appropriate loading and error states
- Responsive design works across devices

**Deliverables:**
- Loading skeletons for all data-dependent components
- Error boundaries with user-friendly messages
- 404 page for invalid routes
- Mobile-responsive navigation
- LocalStorage for user preferences (default view, last team)

**Success Criteria:**
- No layout shift during loading
- Errors display helpful messages (not technical details)
- Works on mobile browsers
- User preferences persist across sessions

---

## Phase 6: Deployment & Launch

### Checkpoint 6.1: Frontend Deployment
**Expected Outcomes:**
- Frontend deployed and accessible via public URL
- Automatic deployments on main branch push
- Environment variables properly configured

**Platform:** Vercel

**Deliverables:**
- Vercel project configured
- Production environment variables set
- Custom domain configured (optional)
- Build succeeds on push to main

**Success Criteria:**
- Frontend accessible at public URL
- All pages load correctly
- API requests reach backend
- HTTPS enabled

---

### Checkpoint 6.2: Backend Deployment
**Expected Outcomes:**
- Backend API deployed and accessible
- Database connection working in production
- Cron jobs running on schedule

**Platform:** Vercel Serverless Functions or Railway/Render

**Configuration:**
- Environment variables (API keys, database URL)
- Cron job scheduling
- Memory/timeout limits appropriate for jobs

**Deliverables:**
- Backend deployed to production
- API accessible at public URL
- Cron jobs configured and running
- Logs accessible for debugging

**Success Criteria:**
- All API endpoints respond correctly
- Database operations work in production
- Cron jobs execute on schedule
- Response times acceptable (<500ms)

---

### Checkpoint 6.3: Initial Data Population
**Expected Outcomes:**
- Production database seeded with teams
- Current season schedule populated
- Recent games have videos attached

**Actions:**
1. Run teams seed migration
2. Execute initial schedule fetch (current season)
3. Execute video discovery for recent finished games
4. Verify data quality

**Success Criteria:**
- All 30 teams in database
- Games from current season present
- Recent games (last 7 days) have videos
- Frontend displays real data

---

### Checkpoint 6.4: Production Validation
**Expected Outcomes:**
- Application fully functional in production
- All user flows working end-to-end
- Performance acceptable

**Validation Checklist:**
- [ ] Home page loads and displays teams
- [ ] Can navigate to any team page
- [ ] Team pages show recent games with videos
- [ ] Can navigate to any date
- [ ] Date pages show games correctly
- [ ] Videos open correctly in YouTube
- [ ] Mobile experience works
- [ ] Schedule sync job runs successfully
- [ ] Video discovery job runs successfully
- [ ] API response times under 500ms

**Success Criteria:**
- All checklist items pass
- No critical errors in logs
- Ready for public use

---

## Phase 7: Monitoring & Operations

### Checkpoint 7.1: Observability Setup
**Expected Outcomes:**
- Visibility into application health
- Alerting for critical issues
- Log aggregation for debugging

**Deliverables:**
- Application logging (structured JSON)
- Health check endpoint with dependency status
- Basic uptime monitoring
- YouTube API quota tracking dashboard

**Success Criteria:**
- Can determine application health at a glance
- Logs searchable for debugging
- Alerts trigger for downtime
- Quota usage visible

---

### Checkpoint 7.2: Operations Runbook
**Expected Outcomes:**
- Documentation for common operational tasks
- Troubleshooting guide for known issues
- Procedures for manual interventions

**Documentation Topics:**
- How to manually trigger schedule sync
- How to manually search video for a game
- How to check YouTube API quota usage
- How to handle missing videos
- How to rollback database migrations
- How to restart jobs

**Deliverables:**
- `OPERATIONS.md` with procedures
- Common issues and solutions
- Contact points and escalation

**Success Criteria:**
- Any developer can perform routine operations
- Known issues have documented solutions

---

## Summary: Launch Readiness Checklist

### Infrastructure
- [ ] Production database provisioned and accessible
- [ ] Vercel accounts configured
- [ ] YouTube API key active with quota alerts
- [ ] Domain/URL configured

### Backend
- [ ] All API endpoints functional
- [ ] Schedule sync job running daily
- [ ] Video discovery job running regularly
- [ ] Error handling prevents crashes

### Frontend
- [ ] All pages render correctly
- [ ] Navigation works throughout app
- [ ] Videos accessible via YouTube links
- [ ] Mobile responsive

### Data
- [ ] All 30 NBA teams seeded
- [ ] Current season schedule populated
- [ ] Recent games have videos
- [ ] Data refreshing automatically

### Operations
- [ ] Logs accessible
- [ ] Health checks passing
- [ ] Monitoring in place
- [ ] Runbook documented

---

## Appendix: Resource Requirements

### External Services
| Service | Tier | Estimated Cost |
|---------|------|----------------|
| Vercel | Free/Hobby | $0-20/month |
| Neon PostgreSQL | Free tier | $0/month |
| YouTube API | Free tier | $0 (10k units/day) |
| NBA Schedule API | Free | $0 |

### YouTube API Quota Budget
- Daily limit: 10,000 units
- Per search: ~100 units
- Available searches: ~100/day
- Games per day: ~15 max
- Buffer for retries: 50+ searches available

### Database Size Estimates
- Teams: 30 rows (static)
- Games: ~1,230 rows/season (~82 games × 30 teams ÷ 2)
- Videos: ~1,230 rows/season (1:1 with games)
- Total: <5,000 rows for full season (well within free tiers)
