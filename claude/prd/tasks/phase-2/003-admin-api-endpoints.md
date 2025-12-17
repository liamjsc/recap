# Task: Implement Admin API Endpoints

## Task ID
`phase-2/003-admin-api-endpoints`

## Description
Implement protected administrative endpoints for manually triggering schedule fetches and video discovery operations.

## Prerequisites
- `phase-2/002-games-api-endpoints` completed

## Expected Outcomes
1. Admin endpoints protected by API key authentication
2. POST `/api/admin/fetch-schedule` triggers schedule sync
3. POST `/api/admin/fetch-videos` triggers video discovery for all pending games
4. POST `/api/admin/fetch-video/:gameId` triggers video discovery for specific game
5. Proper status responses indicating operation results

## Deliverables

### Admin Authentication Middleware
```typescript
// backend/src/middleware/adminAuth.ts

import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-admin-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({
      error: 'Admin API key required',
      code: 'MISSING_API_KEY',
    });
  }

  if (apiKey !== env.adminApiKey) {
    return res.status(403).json({
      error: 'Invalid admin API key',
      code: 'INVALID_API_KEY',
    });
  }

  next();
}
```

### API Endpoints

#### POST `/api/admin/fetch-schedule`
**Description:** Manually trigger NBA schedule sync

**Headers:**
- `X-Admin-API-Key: your-admin-key`

**Request Body (optional):**
```json
{
  "startDate": "2024-12-01",
  "endDate": "2024-12-31"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Schedule sync completed",
  "result": {
    "gamesAdded": 15,
    "gamesUpdated": 8,
    "errors": 0
  }
}
```

**Response (500):**
```json
{
  "success": false,
  "error": "Schedule sync failed",
  "details": "NBA API unreachable"
}
```

#### POST `/api/admin/fetch-videos`
**Description:** Search for videos for all finished games without videos

**Headers:**
- `X-Admin-API-Key: your-admin-key`

**Request Body (optional):**
```json
{
  "limit": 10
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Video discovery completed",
  "result": {
    "gamesProcessed": 10,
    "videosFound": 8,
    "videosFailed": 2,
    "quotaUsed": 800
  }
}
```

#### POST `/api/admin/fetch-video/:gameId`
**Description:** Search for video for a specific game

**Headers:**
- `X-Admin-API-Key: your-admin-key`

**Response (200) - Video found:**
```json
{
  "success": true,
  "message": "Video found and saved",
  "video": {
    "id": 123,
    "youtubeVideoId": "abc123xyz",
    "title": "LAKERS at SUNS | FULL GAME HIGHLIGHTS | December 14, 2024"
  }
}
```

**Response (200) - Video not found:**
```json
{
  "success": true,
  "message": "No matching video found",
  "video": null
}
```

**Response (404):**
```json
{
  "success": false,
  "error": "Game not found",
  "code": "GAME_NOT_FOUND"
}
```

### Route Implementation
```typescript
// backend/src/routes/api/admin.ts

import { Router, Request, Response } from 'express';
import { adminAuth } from '../../middleware/adminAuth';
import { scheduleService } from '../../services/schedule';
import { videoMatcherService } from '../../services/videoMatcher';
import { gameQueries } from '../../db/queries';

const router = Router();

// Apply admin auth to all routes
router.use(adminAuth);

// POST /api/admin/fetch-schedule
router.post('/fetch-schedule', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.body;

    const result = await scheduleService.syncSchedule({
      startDate: startDate || getDefaultStartDate(),
      endDate: endDate || getDefaultEndDate(),
    });

    res.json({
      success: true,
      message: 'Schedule sync completed',
      result,
    });
  } catch (error) {
    console.error('Schedule sync failed:', error);
    res.status(500).json({
      success: false,
      error: 'Schedule sync failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/admin/fetch-videos
router.post('/fetch-videos', async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.body;

    const result = await videoMatcherService.discoverVideos({
      limit: Math.min(limit, 50), // Cap at 50 to preserve quota
    });

    res.json({
      success: true,
      message: 'Video discovery completed',
      result,
    });
  } catch (error) {
    console.error('Video discovery failed:', error);
    res.status(500).json({
      success: false,
      error: 'Video discovery failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/admin/fetch-video/:gameId
router.post('/fetch-video/:gameId', async (req: Request, res: Response) => {
  try {
    const gameId = parseInt(req.params.gameId, 10);

    if (isNaN(gameId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid game ID',
        code: 'INVALID_ID',
      });
    }

    const game = await gameQueries.findById(gameId);

    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found',
        code: 'GAME_NOT_FOUND',
      });
    }

    const video = await videoMatcherService.discoverVideoForGame(gameId);

    res.json({
      success: true,
      message: video ? 'Video found and saved' : 'No matching video found',
      video: video ? {
        id: video.id,
        youtubeVideoId: video.youtube_video_id,
        title: video.title,
      } : null,
    });
  } catch (error) {
    console.error('Video fetch failed:', error);
    res.status(500).json({
      success: false,
      error: 'Video fetch failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

function getDefaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 3);
  return date.toISOString().split('T')[0];
}

function getDefaultEndDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
}

export default router;
```

### Response Types
```typescript
// backend/src/types/api.ts (add to existing)

export interface AdminScheduleSyncResponse {
  success: boolean;
  message: string;
  result?: {
    gamesAdded: number;
    gamesUpdated: number;
    errors: number;
  };
  error?: string;
  details?: string;
}

export interface AdminVideoDiscoveryResponse {
  success: boolean;
  message: string;
  result?: {
    gamesProcessed: number;
    videosFound: number;
    videosFailed: number;
    quotaUsed: number;
  };
  error?: string;
  details?: string;
}

export interface AdminVideoFetchResponse {
  success: boolean;
  message: string;
  video: {
    id: number;
    youtubeVideoId: string;
    title: string;
  } | null;
  error?: string;
  code?: string;
}
```

## Acceptance Criteria
- [ ] Requests without `X-Admin-API-Key` header return 401
- [ ] Requests with wrong API key return 403
- [ ] POST `/api/admin/fetch-schedule` triggers schedule sync (stub OK)
- [ ] POST `/api/admin/fetch-videos` triggers video discovery (stub OK)
- [ ] POST `/api/admin/fetch-video/123` attempts to find video for game 123
- [ ] POST `/api/admin/fetch-video/999999` returns 404
- [ ] All responses include `success` boolean
- [ ] Errors include helpful messages

## Technical Notes
- Admin endpoints should log all operations for audit trail
- Limit video discovery to preserve YouTube API quota
- Service methods can be stubs initially (implemented in Phase 3)
- Consider rate limiting admin endpoints

## Estimated Complexity
Medium - Authentication + integration with services

## Dependencies
- Task `phase-2/002-games-api-endpoints`
