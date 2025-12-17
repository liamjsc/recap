# Task: Implement Games API Endpoints

## Task ID
`phase-2/002-games-api-endpoints`

## Description
Implement the REST API endpoints for retrieving NBA game data, including games by date and games for a specific team.

## Prerequisites
- `phase-2/001-teams-api-endpoints` completed

## Expected Outcomes
1. GET `/api/games/date/:date` returns all games on a specific date
2. GET `/api/games/:id` returns single game with video
3. GET `/api/teams/:id/games` returns recent games for a team
4. Games include related team information and video when available

## Deliverables

### API Endpoints

#### GET `/api/games/date/:date`
**Description:** Get all games on a specific date

**Parameters:**
- `:date` - Date in YYYY-MM-DD format

**Response (200):**
```json
{
  "date": "2024-12-14",
  "games": [
    {
      "id": 123,
      "gameDate": "2024-12-14",
      "gameTime": "2024-12-14T19:00:00Z",
      "status": "finished",
      "homeTeam": {
        "id": 24,
        "name": "Suns",
        "abbreviation": "PHX"
      },
      "awayTeam": {
        "id": 23,
        "name": "Lakers",
        "abbreviation": "LAL"
      },
      "homeScore": 110,
      "awayScore": 115,
      "video": {
        "id": 45,
        "youtubeVideoId": "abc123xyz",
        "title": "LAKERS at SUNS | FULL GAME HIGHLIGHTS | December 14, 2024",
        "thumbnailUrl": "https://i.ytimg.com/vi/abc123xyz/maxresdefault.jpg",
        "durationSeconds": 592,
        "channelName": "NBA",
        "isVerified": true,
        "url": "https://www.youtube.com/watch?v=abc123xyz"
      }
    }
  ]
}
```

**Response (400) - Invalid date:**
```json
{
  "error": "Invalid date format. Use YYYY-MM-DD",
  "code": "INVALID_DATE"
}
```

#### GET `/api/games/:id`
**Description:** Get single game by ID

**Response (200):**
```json
{
  "game": {
    "id": 123,
    "gameDate": "2024-12-14",
    "gameTime": "2024-12-14T19:00:00Z",
    "status": "finished",
    "homeTeam": { /* team object */ },
    "awayTeam": { /* team object */ },
    "homeScore": 110,
    "awayScore": 115,
    "video": { /* video object or null */ }
  }
}
```

#### GET `/api/teams/:id/games`
**Description:** Get recent games for a specific team

**Query Parameters:**
- `limit` (optional): Number of games to return (default: 10, max: 50)

**Response (200):**
```json
{
  "team": {
    "id": 23,
    "name": "Lakers",
    "abbreviation": "LAL"
  },
  "games": [
    // Array of game objects (most recent first)
  ]
}
```

### Route Implementation
```typescript
// backend/src/routes/api/games.ts

import { Router, Request, Response } from 'express';
import { gameQueries, teamQueries } from '../../db/queries';

const router = Router();

// GET /api/games/date/:date
router.get('/date/:date', async (req: Request, res: Response) => {
  const { date } = req.params;

  // Validate date format
  if (!isValidDate(date)) {
    return res.status(400).json({
      error: 'Invalid date format. Use YYYY-MM-DD',
      code: 'INVALID_DATE',
    });
  }

  const games = await gameQueries.findByDate(date);

  res.json({
    date,
    games: games.map(formatGameWithVideo),
  });
});

// GET /api/games/:id
router.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({
      error: 'Invalid game ID',
      code: 'INVALID_ID',
    });
  }

  const game = await gameQueries.findByIdWithDetails(id);

  if (!game) {
    return res.status(404).json({
      error: 'Game not found',
      code: 'GAME_NOT_FOUND',
    });
  }

  res.json({ game: formatGameWithVideo(game) });
});

function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

function formatGameWithVideo(game: GameWithVideo) {
  return {
    id: game.id,
    gameDate: game.game_date,
    gameTime: game.game_time,
    status: game.status,
    homeTeam: formatTeamBrief(game.home_team),
    awayTeam: formatTeamBrief(game.away_team),
    homeScore: game.home_score,
    awayScore: game.away_score,
    video: game.video ? formatVideo(game.video) : null,
  };
}

export default router;
```

```typescript
// backend/src/routes/api/teams.ts (add to existing)

// GET /api/teams/:id/games
router.get('/:id/games', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

  if (isNaN(id)) {
    return res.status(400).json({
      error: 'Invalid team ID',
      code: 'INVALID_ID',
    });
  }

  const team = await teamQueries.findById(id);

  if (!team) {
    return res.status(404).json({
      error: 'Team not found',
      code: 'TEAM_NOT_FOUND',
    });
  }

  const games = await gameQueries.findByTeam(id, limit);

  res.json({
    team: formatTeamBrief(team),
    games: games.map(formatGameWithVideo),
  });
});
```

### Response Types
```typescript
// backend/src/types/api.ts (add to existing)

export interface GameResponse {
  id: number;
  gameDate: string;
  gameTime: string | null;
  status: 'scheduled' | 'in_progress' | 'finished';
  homeTeam: TeamBriefResponse;
  awayTeam: TeamBriefResponse;
  homeScore: number | null;
  awayScore: number | null;
  video: VideoResponse | null;
}

export interface TeamBriefResponse {
  id: number;
  name: string;
  abbreviation: string;
}

export interface VideoResponse {
  id: number;
  youtubeVideoId: string;
  title: string;
  thumbnailUrl: string;
  durationSeconds: number;
  channelName: string;
  isVerified: boolean;
  url: string;
}

export interface GamesDateResponse {
  date: string;
  games: GameResponse[];
}

export interface TeamGamesResponse {
  team: TeamBriefResponse;
  games: GameResponse[];
}
```

## Acceptance Criteria
- [ ] GET `/api/games/date/2024-12-14` returns games for that date
- [ ] GET `/api/games/date/invalid` returns 400 with error
- [ ] GET `/api/games/123` returns game with teams and video
- [ ] GET `/api/games/999999` returns 404
- [ ] GET `/api/teams/1/games` returns team's recent games
- [ ] GET `/api/teams/1/games?limit=5` returns only 5 games
- [ ] Limit is capped at 50 maximum
- [ ] Games without videos have `video: null`
- [ ] Games are sorted by date descending

## Technical Notes
- Date validation prevents SQL errors from malformed dates
- Limit parameter prevents excessive data transfer
- Video object null when no highlight found yet
- Consider caching recent dates (high traffic)

## Estimated Complexity
Medium - Multiple endpoints with joins

## Dependencies
- Task `phase-2/001-teams-api-endpoints`
