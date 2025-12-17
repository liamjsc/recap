# Task: Implement YouTube Data API Integration

## Task ID
`phase-3/002-youtube-api-integration`

## Description
Create a service module that interfaces with the YouTube Data API v3 to search for NBA highlight videos, retrieve video details, and manage API quota usage.

## Prerequisites
- `phase-0/004-environment-variables-setup` completed
- YouTube Data API key configured

## Expected Outcomes
1. YouTube service that searches for videos by query
2. Video detail retrieval (duration, view count, etc.)
3. Quota tracking and management
4. Proper filtering by channel, duration, and upload date

## Deliverables

### File Structure
```
backend/src/services/youtube/
├── index.ts           # Main service export
├── client.ts          # YouTube API client
├── types.ts           # YouTube API types
├── quota.ts           # Quota tracking
└── filters.ts         # Result filtering utilities
```

### YouTube API Types
```typescript
// backend/src/services/youtube/types.ts

export interface YouTubeSearchParams {
  query: string;
  channelId?: string;
  publishedAfter?: Date;
  publishedBefore?: Date;
  maxResults?: number;
  videoDuration?: 'short' | 'medium' | 'long';
}

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnails: {
    default: YouTubeThumbnail;
    medium: YouTubeThumbnail;
    high: YouTubeThumbnail;
    maxres?: YouTubeThumbnail;
  };
}

export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface YouTubeVideoDetails {
  videoId: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  duration: string;        // ISO 8601 duration (PT15M30S)
  durationSeconds: number; // Parsed to seconds
  viewCount: number;
  thumbnailUrl: string;
}

// Raw API response types
export interface YouTubeSearchResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeSearchItem[];
}

export interface YouTubeSearchItem {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: YouTubeSearchResult['thumbnails'];
    channelTitle: string;
    liveBroadcastContent: string;
  };
}

export interface YouTubeVideoResponse {
  kind: string;
  etag: string;
  items: YouTubeVideoItem[];
}

export interface YouTubeVideoItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: YouTubeSearchResult['thumbnails'];
    channelTitle: string;
  };
  contentDetails: {
    duration: string;
    dimension: string;
    definition: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}
```

### Quota Tracker
```typescript
// backend/src/services/youtube/quota.ts

// YouTube API quota costs
const QUOTA_COSTS = {
  search: 100,
  videos: 1,
};

const DAILY_LIMIT = 10000;

// Simple in-memory tracker (resets on restart)
// For production, use Redis or database
let dailyUsage = 0;
let lastResetDate = new Date().toDateString();

export const quotaTracker = {
  canMakeRequest(type: 'search' | 'videos'): boolean {
    this.checkReset();
    return dailyUsage + QUOTA_COSTS[type] <= DAILY_LIMIT;
  },

  recordUsage(type: 'search' | 'videos'): void {
    this.checkReset();
    dailyUsage += QUOTA_COSTS[type];
  },

  getUsage(): { used: number; remaining: number; limit: number } {
    this.checkReset();
    return {
      used: dailyUsage,
      remaining: DAILY_LIMIT - dailyUsage,
      limit: DAILY_LIMIT,
    };
  },

  checkReset(): void {
    const today = new Date().toDateString();
    if (today !== lastResetDate) {
      dailyUsage = 0;
      lastResetDate = today;
    }
  },
};
```

### YouTube API Client
```typescript
// backend/src/services/youtube/client.ts

import { env } from '../../config/env';
import { ExternalApiError, RateLimitError } from '../../errors';
import { quotaTracker } from './quota';
import {
  YouTubeSearchParams,
  YouTubeSearchResponse,
  YouTubeVideoResponse,
  YouTubeVideoDetails,
} from './types';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Official NBA channel ID
export const NBA_CHANNEL_ID = 'UCWJ2lWNubArHWmf3FIHbfcQ';

export async function searchVideos(
  params: YouTubeSearchParams
): Promise<YouTubeSearchResponse> {
  if (!quotaTracker.canMakeRequest('search')) {
    throw new RateLimitError('YouTube API daily quota exceeded');
  }

  const url = new URL(`${BASE_URL}/search`);
  url.searchParams.set('key', env.youtubeApiKey);
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('type', 'video');
  url.searchParams.set('q', params.query);
  url.searchParams.set('maxResults', (params.maxResults || 10).toString());
  url.searchParams.set('order', 'date');

  if (params.channelId) {
    url.searchParams.set('channelId', params.channelId);
  }
  if (params.publishedAfter) {
    url.searchParams.set('publishedAfter', params.publishedAfter.toISOString());
  }
  if (params.publishedBefore) {
    url.searchParams.set('publishedBefore', params.publishedBefore.toISOString());
  }
  if (params.videoDuration) {
    url.searchParams.set('videoDuration', params.videoDuration);
  }

  const response = await fetch(url.toString());

  quotaTracker.recordUsage('search');

  if (!response.ok) {
    const error = await response.json();
    throw new ExternalApiError('YouTube', error.error?.message || response.statusText);
  }

  return response.json();
}

export async function getVideoDetails(
  videoIds: string[]
): Promise<YouTubeVideoDetails[]> {
  if (videoIds.length === 0) {
    return [];
  }

  if (!quotaTracker.canMakeRequest('videos')) {
    throw new RateLimitError('YouTube API daily quota exceeded');
  }

  const url = new URL(`${BASE_URL}/videos`);
  url.searchParams.set('key', env.youtubeApiKey);
  url.searchParams.set('part', 'snippet,contentDetails,statistics');
  url.searchParams.set('id', videoIds.join(','));

  const response = await fetch(url.toString());

  quotaTracker.recordUsage('videos');

  if (!response.ok) {
    const error = await response.json();
    throw new ExternalApiError('YouTube', error.error?.message || response.statusText);
  }

  const data: YouTubeVideoResponse = await response.json();

  return data.items.map(item => ({
    videoId: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    channelId: item.snippet.channelId,
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
    duration: item.contentDetails.duration,
    durationSeconds: parseDuration(item.contentDetails.duration),
    viewCount: parseInt(item.statistics.viewCount, 10) || 0,
    thumbnailUrl: getBestThumbnail(item.snippet.thumbnails),
  }));
}

function parseDuration(duration: string): number {
  // Parse ISO 8601 duration (PT15M30S)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

function getBestThumbnail(thumbnails: any): string {
  return thumbnails.maxres?.url
    || thumbnails.high?.url
    || thumbnails.medium?.url
    || thumbnails.default?.url;
}
```

### Main Service
```typescript
// backend/src/services/youtube/index.ts

import { searchVideos, getVideoDetails, NBA_CHANNEL_ID } from './client';
import { quotaTracker } from './quota';
import { YouTubeVideoDetails } from './types';

export interface VideoSearchOptions {
  awayTeam: string;
  homeTeam: string;
  gameDate: Date;
  searchOfficialOnly?: boolean;
}

export const youtubeService = {
  async searchHighlightVideo(
    options: VideoSearchOptions
  ): Promise<YouTubeVideoDetails | null> {
    const { awayTeam, homeTeam, gameDate, searchOfficialOnly = true } = options;

    // Build search query matching NBA's title format
    // "LAKERS at SUNS | FULL GAME HIGHLIGHTS | December 14, 2024"
    const dateStr = formatDateForSearch(gameDate);
    const query = `${awayTeam} at ${homeTeam} FULL GAME HIGHLIGHTS ${dateStr}`;

    console.log(`Searching YouTube: "${query}"`);

    // Calculate search window (game date + 12 hours buffer)
    const publishedAfter = new Date(gameDate);
    publishedAfter.setHours(publishedAfter.getHours() - 2);

    const publishedBefore = new Date(gameDate);
    publishedBefore.setDate(publishedBefore.getDate() + 1);
    publishedBefore.setHours(12);

    const searchResponse = await searchVideos({
      query,
      channelId: searchOfficialOnly ? NBA_CHANNEL_ID : undefined,
      publishedAfter,
      publishedBefore,
      maxResults: 5,
      videoDuration: 'medium', // 4-20 minutes
    });

    if (searchResponse.items.length === 0) {
      console.log('No videos found');
      return null;
    }

    // Get full details for search results
    const videoIds = searchResponse.items.map(item => item.id.videoId);
    const videoDetails = await getVideoDetails(videoIds);

    // Filter and rank results
    const validVideos = videoDetails.filter(video => {
      // Must be 8-25 minutes
      if (video.durationSeconds < 480 || video.durationSeconds > 1500) {
        return false;
      }

      // Title must contain both team names and "HIGHLIGHTS"
      const titleUpper = video.title.toUpperCase();
      if (!titleUpper.includes(awayTeam.toUpperCase())) return false;
      if (!titleUpper.includes(homeTeam.toUpperCase())) return false;
      if (!titleUpper.includes('HIGHLIGHT')) return false;

      return true;
    });

    if (validVideos.length === 0) {
      console.log('No valid videos after filtering');
      return null;
    }

    // Return best match (first valid result, as they're sorted by date)
    return validVideos[0];
  },

  getQuotaStatus() {
    return quotaTracker.getUsage();
  },
};

function formatDateForSearch(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export { NBA_CHANNEL_ID } from './client';
```

## Acceptance Criteria
- [ ] `youtubeService.searchHighlightVideo()` finds videos for known games
- [ ] Search correctly targets NBA official channel
- [ ] Duration filter excludes shorts and very long videos
- [ ] Title validation ensures correct game match
- [ ] Quota tracker prevents exceeding daily limit
- [ ] ISO 8601 duration parsed correctly to seconds
- [ ] Best available thumbnail URL returned
- [ ] API errors handled gracefully

## Technical Notes
- YouTube API key required (from Google Cloud Console)
- Default quota: 10,000 units/day (100 searches)
- Search costs 100 units, video details cost 1 unit
- NBA channel ID is constant: UCWJ2lWNubArHWmf3FIHbfcQ
- Consider adding fallback to non-NBA channels if official not found

## Estimated Complexity
Medium-High - External API with quota management

## Dependencies
- Task `phase-0/004-environment-variables-setup`
- YouTube Data API key
