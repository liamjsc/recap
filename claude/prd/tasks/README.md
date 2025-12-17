# NBA Highlights Aggregator - Task Index

This directory contains detailed task definitions for building the NBA Highlights Aggregator application. Each task is designed to be completed by a coding agent in a focused session.

## Task Structure

Each task file includes:
- **Task ID**: Unique identifier
- **Description**: What needs to be accomplished
- **Prerequisites**: Tasks that must be completed first
- **Expected Outcomes**: Clear deliverables
- **Acceptance Criteria**: Checkboxes to verify completion
- **Technical Notes**: Implementation guidance
- **Dependencies**: Related tasks

---

## Phase 0: Infrastructure Setup
*Foundation for development environment*

| # | Task | Description |
|---|------|-------------|
| 001 | [init-repository-structure](phase-0/001-init-repository-structure.md) | Create monorepo with frontend/backend directories |
| 002 | [frontend-boilerplate](phase-0/002-frontend-boilerplate.md) | Set up React + Vite + Tailwind |
| 003 | [backend-boilerplate](phase-0/003-backend-boilerplate.md) | Set up Express + TypeScript |
| 004 | [environment-variables-setup](phase-0/004-environment-variables-setup.md) | Configure env vars for all environments |
| 005 | [database-connection-setup](phase-0/005-database-connection-setup.md) | Configure PostgreSQL connection |

---

## Phase 1: Database Foundation
*Schema and data access layer*

| # | Task | Description |
|---|------|-------------|
| 001 | [database-migrations-setup](phase-1/001-database-migrations-setup.md) | Configure migration system |
| 002 | [teams-table-migration](phase-1/002-teams-table-migration.md) | Create teams table |
| 003 | [games-table-migration](phase-1/003-games-table-migration.md) | Create games table with FKs |
| 004 | [videos-table-migration](phase-1/004-videos-table-migration.md) | Create videos table |
| 005 | [teams-seed-data](phase-1/005-teams-seed-data.md) | Seed 30 NBA teams |
| 006 | [database-query-helpers](phase-1/006-database-query-helpers.md) | Type-safe query functions |

---

## Phase 2: Backend API
*REST API endpoints*

| # | Task | Description |
|---|------|-------------|
| 001 | [teams-api-endpoints](phase-2/001-teams-api-endpoints.md) | GET /api/teams endpoints |
| 002 | [games-api-endpoints](phase-2/002-games-api-endpoints.md) | GET /api/games endpoints |
| 003 | [admin-api-endpoints](phase-2/003-admin-api-endpoints.md) | POST /api/admin endpoints |
| 004 | [error-handling-validation](phase-2/004-error-handling-validation.md) | Error middleware + Zod validation |

---

## Phase 3: External API Integrations
*Third-party service connections*

| # | Task | Description |
|---|------|-------------|
| 001 | [nba-schedule-api-integration](phase-3/001-nba-schedule-api-integration.md) | Fetch NBA schedule data |
| 002 | [youtube-api-integration](phase-3/002-youtube-api-integration.md) | YouTube video search |
| 003 | [video-matcher-service](phase-3/003-video-matcher-service.md) | Match videos to games |

---

## Phase 4: Automated Jobs
*Background processing*

| # | Task | Description |
|---|------|-------------|
| 001 | [schedule-sync-cron-job](phase-4/001-schedule-sync-cron-job.md) | Daily schedule sync |
| 002 | [video-discovery-cron-job](phase-4/002-video-discovery-cron-job.md) | Periodic video discovery |
| 003 | [job-monitoring-resilience](phase-4/003-job-monitoring-resilience.md) | Job history + retries |

---

## Phase 5: Frontend Application
*React user interface*

| # | Task | Description |
|---|------|-------------|
| 001 | [home-page-component](phase-5/001-home-page-component.md) | Landing page with team/date browser |
| 002 | [team-page-component](phase-5/002-team-page-component.md) | Team detail page |
| 003 | [date-page-component](phase-5/003-date-page-component.md) | Date browser page |
| 004 | [layout-navigation](phase-5/004-layout-navigation.md) | Header, footer, mobile menu |
| 005 | [loading-error-states](phase-5/005-loading-error-states.md) | Skeletons, errors, toasts |
| 006 | [user-preferences](phase-5/006-user-preferences.md) | LocalStorage preferences |

---

## Phase 6: Deployment
*Production infrastructure*

| # | Task | Description |
|---|------|-------------|
| 001 | [vercel-frontend-deployment](phase-6/001-vercel-frontend-deployment.md) | Deploy React to Vercel |
| 002 | [backend-deployment](phase-6/002-backend-deployment.md) | Deploy API to Vercel/Railway |
| 003 | [database-production-setup](phase-6/003-database-production-setup.md) | Configure Neon database |
| 004 | [initial-data-population](phase-6/004-initial-data-population.md) | Seed production data |
| 005 | [production-validation](phase-6/005-production-validation.md) | Launch verification |

---

## Phase 7: Monitoring & Operations
*Production support*

| # | Task | Description |
|---|------|-------------|
| 001 | [logging-observability](phase-7/001-logging-observability.md) | Structured JSON logging |
| 002 | [health-monitoring](phase-7/002-health-monitoring.md) | Health checks + uptime monitoring |
| 003 | [operations-runbook](phase-7/003-operations-runbook.md) | Documentation for operators |

---

## Execution Order

Tasks should generally be executed in phase order. Within each phase, follow the numeric order. Some tasks can be parallelized:

**Can run in parallel:**
- Phase 0: Tasks 002 + 003 (frontend and backend setup)
- Phase 1: Tasks 002-004 (table migrations, after 001)
- Phase 5: Tasks 001-003 (pages, after components exist)

**Must be sequential:**
- All Phase 1 tasks depend on 001
- All Phase 3 tasks must follow Phase 1-2
- Phase 6 requires all previous phases

---

## External Dependencies

Before starting, ensure access to:

| Service | Purpose | Setup Required |
|---------|---------|----------------|
| **Vercel** | Hosting | Create account |
| **Neon** | PostgreSQL database | Create account + project |
| **Google Cloud** | YouTube Data API | Create project + API key |

---

## Total Task Count

| Phase | Tasks | Focus Area |
|-------|-------|------------|
| 0 | 5 | Infrastructure |
| 1 | 6 | Database |
| 2 | 4 | Backend API |
| 3 | 3 | Integrations |
| 4 | 3 | Automation |
| 5 | 6 | Frontend |
| 6 | 5 | Deployment |
| 7 | 3 | Operations |
| **Total** | **35** | |

---

## Getting Started

1. Begin with Phase 0 tasks to set up development environment
2. User provides external service access (Vercel, Neon, YouTube API key)
3. Execute tasks in order, verifying acceptance criteria
4. Use Phase 6 tasks to deploy to production
5. Complete Phase 7 for production readiness
