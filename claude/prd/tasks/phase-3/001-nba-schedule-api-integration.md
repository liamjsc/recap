# Task: Implement NBA Schedule API Integration

## Task ID
`phase-3/001-nba-schedule-api-integration`

## Description
Create a service module that fetches NBA game schedule data from an external API (balldontlie.io or ESPN), parses the responses, and maps them to our internal data structures.

## Prerequisites
- `phase-1/006-database-query-helpers` completed
- `phase-2/004-error-handling-validation` completed

## Expected Outcomes
1. Schedule service that fetches games for a date range
2. Reliable parsing of external API responses
3. Mapping from external team IDs to internal team IDs
4. Error handling for API failures with retry logic

## Deliverables

### File Structure
```
backend/src/services/
├── schedule/
│   ├── index.ts           # Main service export
│   ├── client.ts          # API client
│   ├── parser.ts          # Response parsing
│   ├── mapper.ts          # Data mapping
│   └── types.ts           # External API types
```

### External API Types (balldontlie.io)
```typescript
// backend/src/services/schedule/types.ts

// balldontlie.io API response types
export interface BallDontLieGame {
  id: number;
  date: string;              // "2024-12-14"
  home_team: BallDontLieTeam;
  visitor_team: BallDontLieTeam;
  home_team_score: number;
  visitor_team_score: number;
  status: string;            // "Final", "In Progress", "Scheduled", etc.
  time: string;              // "Final", "7:00 PM ET", etc.
  period: number;
  postseason: boolean;
}

export interface BallDontLieTeam {
  id: number;
  abbreviation: string;
  city: string;
  conference: string;
  division: string;
  full_name: string;
  name: string;
}

export interface BallDontLieResponse {
  data: BallDontLieGame[];
  meta: {
    total_pages: number;
    current_page: number;
    next_page: number | null;
    per_page: number;
    total_count: number;
  };
}
```

### API Client
```typescript
// backend/src/services/schedule/client.ts

import { env } from '../../config/env';
import { ExternalApiError } from '../../errors';
import { BallDontLieResponse } from './types';

const BASE_URL = env.nbaApiUrl;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export async function fetchGames(params: {
  startDate: string;
  endDate: string;
  page?: number;
  perPage?: number;
}): Promise<BallDontLieResponse> {
  const { startDate, endDate, page = 1, perPage = 100 } = params;

  const url = new URL(`${BASE_URL}/games`);
  url.searchParams.set('start_date', startDate);
  url.searchParams.set('end_date', endDate);
  url.searchParams.set('page', page.toString());
  url.searchParams.set('per_page', perPage.toString());

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error as Error;
      console.warn(`NBA API attempt ${attempt} failed:`, error);

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY * attempt);
      }
    }
  }

  throw new ExternalApiError('NBA Schedule', lastError?.message || 'Unknown error');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Team ID Mapper
```typescript
// backend/src/services/schedule/mapper.ts

import { teamQueries } from '../../db/queries';
import { Team } from '../../db/types';

// Cache team lookups
let teamCache: Map<string, number> | null = null;

export async function getTeamIdMap(): Promise<Map<string, number>> {
  if (teamCache) {
    return teamCache;
  }

  const teams = await teamQueries.findAll();
  teamCache = new Map();

  for (const team of teams) {
    // Map by abbreviation (primary)
    teamCache.set(team.abbreviation.toUpperCase(), team.id);
  }

  return teamCache;
}

export async function mapExternalTeamId(abbreviation: string): Promise<number | null> {
  const map = await getTeamIdMap();
  return map.get(abbreviation.toUpperCase()) || null;
}

export function clearTeamCache(): void {
  teamCache = null;
}
```

### Response Parser
```typescript
// backend/src/services/schedule/parser.ts

import { BallDontLieGame } from './types';
import { Game } from '../../db/types';
import { mapExternalTeamId } from './mapper';

export function parseGameStatus(bdlGame: BallDontLieGame): Game['status'] {
  const status = bdlGame.status.toLowerCase();

  if (status === 'final' || status.includes('final')) {
    return 'finished';
  }
  if (status.includes('progress') || bdlGame.period > 0) {
    return 'in_progress';
  }
  return 'scheduled';
}

export async function parseGame(bdlGame: BallDontLieGame): Promise<Partial<Game> | null> {
  const homeTeamId = await mapExternalTeamId(bdlGame.home_team.abbreviation);
  const awayTeamId = await mapExternalTeamId(bdlGame.visitor_team.abbreviation);

  if (!homeTeamId || !awayTeamId) {
    console.warn(`Unknown team in game ${bdlGame.id}:`,
      bdlGame.home_team.abbreviation,
      bdlGame.visitor_team.abbreviation
    );
    return null;
  }

  const gameDate = new Date(bdlGame.date);
  const status = parseGameStatus(bdlGame);

  return {
    external_id: bdlGame.id.toString(),
    game_date: gameDate,
    game_time: parseGameTime(bdlGame),
    home_team_id: homeTeamId,
    away_team_id: awayTeamId,
    status,
    home_score: status === 'finished' ? bdlGame.home_team_score : null,
    away_score: status === 'finished' ? bdlGame.visitor_team_score : null,
  };
}

function parseGameTime(bdlGame: BallDontLieGame): Date | null {
  // balldontlie returns time as "7:00 PM ET" or "Final"
  if (!bdlGame.time || bdlGame.time === 'Final') {
    return null;
  }

  try {
    // Parse time and combine with date
    const dateStr = bdlGame.date;
    const timeStr = bdlGame.time.replace(' ET', '');
    const combined = new Date(`${dateStr} ${timeStr}`);

    if (!isNaN(combined.getTime())) {
      return combined;
    }
  } catch {
    // Ignore parsing errors
  }

  return null;
}
```

### Main Service
```typescript
// backend/src/services/schedule/index.ts

import { fetchGames } from './client';
import { parseGame } from './parser';
import { gameQueries } from '../../db/queries';

export interface SyncResult {
  gamesAdded: number;
  gamesUpdated: number;
  errors: number;
}

export interface SyncOptions {
  startDate: string;
  endDate: string;
}

export const scheduleService = {
  async syncSchedule(options: SyncOptions): Promise<SyncResult> {
    const result: SyncResult = {
      gamesAdded: 0,
      gamesUpdated: 0,
      errors: 0,
    };

    console.log(`Syncing schedule: ${options.startDate} to ${options.endDate}`);

    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetchGames({
        startDate: options.startDate,
        endDate: options.endDate,
        page,
        perPage: 100,
      });

      for (const bdlGame of response.data) {
        try {
          const gameData = await parseGame(bdlGame);

          if (!gameData) {
            result.errors++;
            continue;
          }

          const existing = await gameQueries.findByExternalId(bdlGame.id.toString());

          if (existing) {
            await gameQueries.update(existing.id, gameData);
            result.gamesUpdated++;
          } else {
            await gameQueries.upsertFromApi(gameData);
            result.gamesAdded++;
          }
        } catch (error) {
          console.error(`Error processing game ${bdlGame.id}:`, error);
          result.errors++;
        }
      }

      hasMore = response.meta.next_page !== null;
      page++;
    }

    console.log(`Schedule sync complete:`, result);
    return result;
  },

  async syncToday(): Promise<SyncResult> {
    const today = new Date().toISOString().split('T')[0];
    return this.syncSchedule({ startDate: today, endDate: today });
  },

  async syncRecentAndUpcoming(): Promise<SyncResult> {
    const start = new Date();
    start.setDate(start.getDate() - 3);

    const end = new Date();
    end.setDate(end.getDate() + 7);

    return this.syncSchedule({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    });
  },
};
```

## Acceptance Criteria
- [ ] `scheduleService.syncSchedule()` fetches and stores games
- [ ] Games correctly mapped to internal team IDs
- [ ] Game status correctly parsed (scheduled/in_progress/finished)
- [ ] Scores populated for finished games
- [ ] API errors handled with retries
- [ ] Unknown teams logged but don't crash sync
- [ ] Pagination handles large date ranges
- [ ] Re-running sync updates existing games (upsert)

## Technical Notes
- balldontlie.io is free and doesn't require API key
- Alternative APIs: ESPN, NBA stats (unofficial)
- Cache team mappings to reduce DB queries
- Handle timezone differences (ET to UTC)

## Estimated Complexity
Medium-High - External API integration with data mapping

## Dependencies
- Task `phase-1/006-database-query-helpers`
- Task `phase-2/004-error-handling-validation`
