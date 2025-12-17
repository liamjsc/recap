# Task: Create Database Query Helpers

## Task ID
`phase-1/006-database-query-helpers`

## Description
Create typed query helper functions for common database operations on teams, games, and videos tables.

## Prerequisites
- `phase-1/004-videos-table-migration` completed
- `phase-1/005-teams-seed-data` completed

## Expected Outcomes
1. Type-safe query functions for all tables
2. Common query patterns abstracted into reusable functions
3. Proper TypeScript types for all database entities

## Deliverables

### File Structure
```
backend/src/db/
├── types.ts           # Database entity types
├── queries/
│   ├── index.ts       # Re-export all queries
│   ├── teams.ts       # Team query functions
│   ├── games.ts       # Game query functions
│   └── videos.ts      # Video query functions
```

### Database Types
```typescript
// backend/src/db/types.ts

export interface Team {
  id: number;
  name: string;
  full_name: string;
  abbreviation: string;
  conference: 'Eastern' | 'Western';
  division: string;
  external_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface Game {
  id: number;
  external_id: string | null;
  game_date: Date;
  game_time: Date | null;
  home_team_id: number;
  away_team_id: number;
  status: 'scheduled' | 'in_progress' | 'finished';
  home_score: number | null;
  away_score: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface Video {
  id: number;
  game_id: number;
  youtube_video_id: string;
  title: string;
  channel_name: string;
  channel_id: string;
  duration_seconds: number;
  thumbnail_url: string;
  published_at: Date;
  view_count: number | null;
  url: string;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

// Extended types for queries with joins
export interface GameWithTeams extends Game {
  home_team: Team;
  away_team: Team;
}

export interface GameWithVideo extends GameWithTeams {
  video: Video | null;
}
```

### Team Queries
```typescript
// backend/src/db/queries/teams.ts

import { db } from '../index';
import { Team } from '../types';

export const teamQueries = {
  async findAll(): Promise<Team[]> {
    const result = await db.query<Team>(
      'SELECT * FROM teams ORDER BY full_name'
    );
    return result.rows;
  },

  async findById(id: number): Promise<Team | null> {
    const result = await db.query<Team>(
      'SELECT * FROM teams WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async findByAbbreviation(abbreviation: string): Promise<Team | null> {
    const result = await db.query<Team>(
      'SELECT * FROM teams WHERE UPPER(abbreviation) = UPPER($1)',
      [abbreviation]
    );
    return result.rows[0] || null;
  },

  async findByConference(conference: string): Promise<Team[]> {
    const result = await db.query<Team>(
      'SELECT * FROM teams WHERE conference = $1 ORDER BY full_name',
      [conference]
    );
    return result.rows;
  },
};
```

### Game Queries
```typescript
// backend/src/db/queries/games.ts

import { db } from '../index';
import { Game, GameWithTeams, GameWithVideo } from '../types';

export const gameQueries = {
  async findById(id: number): Promise<Game | null> {
    const result = await db.query<Game>(
      'SELECT * FROM games WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async findByDate(date: string): Promise<GameWithVideo[]> {
    const result = await db.query(
      `SELECT
        g.*,
        row_to_json(ht.*) as home_team,
        row_to_json(at.*) as away_team,
        row_to_json(v.*) as video
      FROM games g
      JOIN teams ht ON g.home_team_id = ht.id
      JOIN teams at ON g.away_team_id = at.id
      LEFT JOIN videos v ON g.id = v.game_id
      WHERE g.game_date = $1
      ORDER BY g.game_time ASC`,
      [date]
    );
    return result.rows;
  },

  async findByTeam(teamId: number, limit: number = 10): Promise<GameWithVideo[]> {
    const result = await db.query(
      `SELECT
        g.*,
        row_to_json(ht.*) as home_team,
        row_to_json(at.*) as away_team,
        row_to_json(v.*) as video
      FROM games g
      JOIN teams ht ON g.home_team_id = ht.id
      JOIN teams at ON g.away_team_id = at.id
      LEFT JOIN videos v ON g.id = v.game_id
      WHERE g.home_team_id = $1 OR g.away_team_id = $1
      ORDER BY g.game_date DESC
      LIMIT $2`,
      [teamId, limit]
    );
    return result.rows;
  },

  async findFinishedWithoutVideo(): Promise<Game[]> {
    const result = await db.query<Game>(
      `SELECT g.* FROM games g
      LEFT JOIN videos v ON g.id = v.game_id
      WHERE g.status = 'finished' AND v.id IS NULL
      ORDER BY g.game_date DESC`
    );
    return result.rows;
  },

  async upsertFromApi(game: Partial<Game>): Promise<Game> {
    const result = await db.query<Game>(
      `INSERT INTO games (external_id, game_date, game_time, home_team_id, away_team_id, status, home_score, away_score)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (external_id) DO UPDATE SET
        game_time = EXCLUDED.game_time,
        status = EXCLUDED.status,
        home_score = EXCLUDED.home_score,
        away_score = EXCLUDED.away_score,
        updated_at = NOW()
      RETURNING *`,
      [game.external_id, game.game_date, game.game_time, game.home_team_id, game.away_team_id, game.status, game.home_score, game.away_score]
    );
    return result.rows[0];
  },
};
```

### Video Queries
```typescript
// backend/src/db/queries/videos.ts

import { db } from '../index';
import { Video } from '../types';

export const videoQueries = {
  async findByGameId(gameId: number): Promise<Video | null> {
    const result = await db.query<Video>(
      'SELECT * FROM videos WHERE game_id = $1',
      [gameId]
    );
    return result.rows[0] || null;
  },

  async findByYoutubeId(youtubeId: string): Promise<Video | null> {
    const result = await db.query<Video>(
      'SELECT * FROM videos WHERE youtube_video_id = $1',
      [youtubeId]
    );
    return result.rows[0] || null;
  },

  async create(video: Omit<Video, 'id' | 'created_at' | 'updated_at'>): Promise<Video> {
    const result = await db.query<Video>(
      `INSERT INTO videos (game_id, youtube_video_id, title, channel_name, channel_id, duration_seconds, thumbnail_url, published_at, view_count, url, is_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [video.game_id, video.youtube_video_id, video.title, video.channel_name, video.channel_id, video.duration_seconds, video.thumbnail_url, video.published_at, video.view_count, video.url, video.is_verified]
    );
    return result.rows[0];
  },

  async existsForGame(gameId: number): Promise<boolean> {
    const result = await db.query(
      'SELECT 1 FROM videos WHERE game_id = $1 LIMIT 1',
      [gameId]
    );
    return result.rows.length > 0;
  },
};
```

### Index Export
```typescript
// backend/src/db/queries/index.ts

export { teamQueries } from './teams';
export { gameQueries } from './games';
export { videoQueries } from './videos';
```

## Acceptance Criteria
- [ ] All query functions compile without TypeScript errors
- [ ] `teamQueries.findAll()` returns all 30 teams
- [ ] `teamQueries.findByAbbreviation('LAL')` returns Lakers
- [ ] `gameQueries.findByDate('2024-12-14')` returns games with teams and videos
- [ ] `gameQueries.findByTeam(teamId, 10)` returns recent games for team
- [ ] `videoQueries.create()` inserts video and returns it
- [ ] All null results handled correctly (return null, not throw)

## Technical Notes
- Use `row_to_json()` for efficient nested object mapping
- Use parameterized queries to prevent SQL injection
- Return null for single-record queries when not found
- Use `LEFT JOIN` for optional video relationship

## Estimated Complexity
Medium - Multiple query patterns with joins

## Dependencies
- Task `phase-1/004-videos-table-migration`
- Task `phase-1/005-teams-seed-data`
