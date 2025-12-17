# Task: Implement Video Matcher Service

## Task ID
`phase-3/003-video-matcher-service`

## Description
Create an orchestration service that combines the schedule and YouTube services to discover and store highlight videos for games, including match quality scoring and failure tracking.

## Prerequisites
- `phase-3/001-nba-schedule-api-integration` completed
- `phase-3/002-youtube-api-integration` completed

## Expected Outcomes
1. Service that discovers videos for finished games
2. Match quality scoring for video-game pairs
3. Storage of discovered videos in database
4. Tracking of failed matches for retry
5. Respect for YouTube API quota limits

## Deliverables

### File Structure
```
backend/src/services/
├── videoMatcher/
│   ├── index.ts           # Main service export
│   ├── matcher.ts         # Core matching logic
│   └── scorer.ts          # Match quality scoring
```

### Match Scorer
```typescript
// backend/src/services/videoMatcher/scorer.ts

import { YouTubeVideoDetails } from '../youtube/types';
import { GameWithTeams } from '../../db/types';

export interface MatchScore {
  total: number;
  breakdown: {
    titleMatch: number;
    dateMatch: number;
    durationScore: number;
    channelScore: number;
    recencyScore: number;
  };
}

const NBA_CHANNEL_ID = 'UCWJ2lWNubArHWmf3FIHbfcQ';
const IDEAL_DURATION = 900; // 15 minutes in seconds

export function scoreMatch(
  video: YouTubeVideoDetails,
  game: GameWithTeams
): MatchScore {
  const breakdown = {
    titleMatch: scoreTitleMatch(video.title, game),
    dateMatch: scoreDateMatch(video.publishedAt, game.game_date),
    durationScore: scoreDuration(video.durationSeconds),
    channelScore: scoreChannel(video.channelId),
    recencyScore: scoreRecency(video.publishedAt, game.game_date),
  };

  const total = Object.values(breakdown).reduce((sum, score) => sum + score, 0);

  return { total, breakdown };
}

function scoreTitleMatch(title: string, game: GameWithTeams): number {
  const titleUpper = title.toUpperCase();
  let score = 0;

  // Check for team names (use abbreviations and short names)
  const homeNames = [
    game.home_team.abbreviation,
    game.home_team.name.toUpperCase(),
  ];
  const awayNames = [
    game.away_team.abbreviation,
    game.away_team.name.toUpperCase(),
  ];

  for (const name of homeNames) {
    if (titleUpper.includes(name)) {
      score += 15;
      break;
    }
  }

  for (const name of awayNames) {
    if (titleUpper.includes(name)) {
      score += 15;
      break;
    }
  }

  // Check for "FULL GAME HIGHLIGHTS"
  if (titleUpper.includes('FULL GAME HIGHLIGHTS')) {
    score += 20;
  } else if (titleUpper.includes('HIGHLIGHTS')) {
    score += 10;
  }

  // Check for "at" format (away at home)
  if (titleUpper.includes(' AT ')) {
    score += 5;
  }

  return score; // Max: 55
}

function scoreDateMatch(publishedAt: string, gameDate: Date): number {
  const published = new Date(publishedAt);
  const game = new Date(gameDate);

  const hoursDiff = Math.abs(published.getTime() - game.getTime()) / (1000 * 60 * 60);

  // Published within 6 hours of game date: full score
  if (hoursDiff <= 6) return 20;
  // Within 12 hours: partial score
  if (hoursDiff <= 12) return 15;
  // Within 24 hours: lower score
  if (hoursDiff <= 24) return 10;
  // Within 48 hours: minimal score
  if (hoursDiff <= 48) return 5;

  return 0; // Max: 20
}

function scoreDuration(durationSeconds: number): number {
  // Ideal duration is ~15 minutes (900 seconds)
  const diff = Math.abs(durationSeconds - IDEAL_DURATION);

  // Within 3 minutes of ideal: full score
  if (diff <= 180) return 15;
  // Within 5 minutes: good score
  if (diff <= 300) return 12;
  // Within 10 minutes: partial score
  if (diff <= 600) return 8;

  // Too short or too long
  if (durationSeconds < 300) return 2; // Under 5 min
  if (durationSeconds > 1800) return 2; // Over 30 min

  return 5; // Max: 15
}

function scoreChannel(channelId: string): number {
  // Official NBA channel gets full score
  if (channelId === NBA_CHANNEL_ID) return 10;

  // Other channels get minimal score
  return 2; // Max: 10
}

function scoreRecency(publishedAt: string, gameDate: Date): number {
  const published = new Date(publishedAt);
  const game = new Date(gameDate);

  // Video should be published AFTER the game
  if (published < game) return 0;

  const hoursAfter = (published.getTime() - game.getTime()) / (1000 * 60 * 60);

  // Published 2-6 hours after game: ideal
  if (hoursAfter >= 2 && hoursAfter <= 6) return 10;
  // Published 6-12 hours after: good
  if (hoursAfter <= 12) return 7;
  // Published 12-24 hours after: acceptable
  if (hoursAfter <= 24) return 4;

  return 1; // Max: 10
}

// Minimum score to consider a valid match
export const MINIMUM_MATCH_SCORE = 60;
```

### Main Video Matcher Service
```typescript
// backend/src/services/videoMatcher/index.ts

import { youtubeService } from '../youtube';
import { gameQueries, videoQueries, teamQueries } from '../../db/queries';
import { Video, GameWithTeams } from '../../db/types';
import { scoreMatch, MINIMUM_MATCH_SCORE } from './scorer';

export interface DiscoveryOptions {
  limit?: number;
  minHoursAfterGame?: number;
}

export interface DiscoveryResult {
  gamesProcessed: number;
  videosFound: number;
  videosFailed: number;
  quotaUsed: number;
}

export const videoMatcherService = {
  async discoverVideos(options: DiscoveryOptions = {}): Promise<DiscoveryResult> {
    const { limit = 10, minHoursAfterGame = 3 } = options;

    const result: DiscoveryResult = {
      gamesProcessed: 0,
      videosFound: 0,
      videosFailed: 0,
      quotaUsed: 0,
    };

    // Get finished games without videos
    const games = await gameQueries.findFinishedWithoutVideo();

    // Filter to games that ended at least N hours ago
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - minHoursAfterGame);

    const eligibleGames = games
      .filter(game => {
        const gameEnd = new Date(game.game_date);
        gameEnd.setHours(gameEnd.getHours() + 3); // Assume 3-hour game duration
        return gameEnd <= cutoffTime;
      })
      .slice(0, limit);

    console.log(`Processing ${eligibleGames.length} games for video discovery`);

    for (const game of eligibleGames) {
      result.gamesProcessed++;

      try {
        const video = await this.discoverVideoForGame(game.id);

        if (video) {
          result.videosFound++;
        } else {
          result.videosFailed++;
        }
      } catch (error) {
        console.error(`Error discovering video for game ${game.id}:`, error);
        result.videosFailed++;
      }
    }

    result.quotaUsed = youtubeService.getQuotaStatus().used;

    return result;
  },

  async discoverVideoForGame(gameId: number): Promise<Video | null> {
    // Check if video already exists
    const existingVideo = await videoQueries.findByGameId(gameId);
    if (existingVideo) {
      console.log(`Video already exists for game ${gameId}`);
      return existingVideo;
    }

    // Get game with team details
    const game = await gameQueries.findByIdWithDetails(gameId);
    if (!game) {
      console.error(`Game ${gameId} not found`);
      return null;
    }

    if (game.status !== 'finished') {
      console.log(`Game ${gameId} not finished yet`);
      return null;
    }

    // Search for video
    const videoDetails = await youtubeService.searchHighlightVideo({
      awayTeam: game.away_team.name.toUpperCase(),
      homeTeam: game.home_team.name.toUpperCase(),
      gameDate: new Date(game.game_date),
      searchOfficialOnly: true,
    });

    if (!videoDetails) {
      console.log(`No video found for game ${gameId}`);
      return null;
    }

    // Score the match
    const score = scoreMatch(videoDetails, game);
    console.log(`Match score for game ${gameId}: ${score.total}`, score.breakdown);

    if (score.total < MINIMUM_MATCH_SCORE) {
      console.log(`Match score ${score.total} below threshold ${MINIMUM_MATCH_SCORE}`);
      return null;
    }

    // Check for duplicate YouTube video
    const existingByYoutubeId = await videoQueries.findByYoutubeId(videoDetails.videoId);
    if (existingByYoutubeId) {
      console.warn(`YouTube video ${videoDetails.videoId} already linked to another game`);
      return null;
    }

    // Store the video
    const video = await videoQueries.create({
      game_id: gameId,
      youtube_video_id: videoDetails.videoId,
      title: videoDetails.title,
      channel_name: videoDetails.channelTitle,
      channel_id: videoDetails.channelId,
      duration_seconds: videoDetails.durationSeconds,
      thumbnail_url: videoDetails.thumbnailUrl,
      published_at: new Date(videoDetails.publishedAt),
      view_count: videoDetails.viewCount,
      url: `https://www.youtube.com/watch?v=${videoDetails.videoId}`,
      is_verified: videoDetails.channelId === 'UCWJ2lWNubArHWmf3FIHbfcQ',
    });

    console.log(`Saved video ${video.id} for game ${gameId}`);
    return video;
  },
};
```

### Additional Query Methods Needed
```typescript
// Add to backend/src/db/queries/games.ts

async findByIdWithDetails(id: number): Promise<GameWithTeams | null> {
  const result = await db.query(
    `SELECT
      g.*,
      row_to_json(ht.*) as home_team,
      row_to_json(at.*) as away_team
    FROM games g
    JOIN teams ht ON g.home_team_id = ht.id
    JOIN teams at ON g.away_team_id = at.id
    WHERE g.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async findByExternalId(externalId: string): Promise<Game | null> {
  const result = await db.query<Game>(
    'SELECT * FROM games WHERE external_id = $1',
    [externalId]
  );
  return result.rows[0] || null;
}

async update(id: number, data: Partial<Game>): Promise<Game> {
  // Build dynamic update query
  const fields = Object.keys(data);
  const values = Object.values(data);
  const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');

  const result = await db.query<Game>(
    `UPDATE games SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0];
}
```

## Acceptance Criteria
- [ ] `videoMatcherService.discoverVideos()` processes pending games
- [ ] Only finished games with no video are processed
- [ ] Games must be N hours old before processing
- [ ] Match scoring correctly ranks video quality
- [ ] Low-scoring matches rejected
- [ ] Duplicate YouTube videos prevented
- [ ] Videos correctly stored in database
- [ ] Quota respected (stops when limit reached)
- [ ] Errors logged but don't crash entire process

## Technical Notes
- Match threshold of 60 can be tuned based on real results
- Official NBA channel gets significant scoring bonus
- Consider fallback search without channel filter if official not found
- Track failed games for manual review

## Estimated Complexity
High - Orchestration with scoring algorithm

## Dependencies
- Task `phase-3/001-nba-schedule-api-integration`
- Task `phase-3/002-youtube-api-integration`
