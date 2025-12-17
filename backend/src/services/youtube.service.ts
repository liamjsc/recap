import { env } from '../config/env';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnails: {
    default: { url: string; width: number; height: number };
    medium: { url: string; width: number; height: number };
    high: { url: string; width: number; height: number };
  };
  duration: string; // ISO 8601 duration format (e.g., "PT5M30S")
  viewCount?: string;
  likeCount?: string;
}

export interface YouTubeSearchResult {
  videos: YouTubeVideo[];
  totalResults: number;
  nextPageToken?: string;
}

/**
 * Parse ISO 8601 duration (PT5M30S) to seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * YouTube Data API v3 Service
 */
export const youtubeService = {
  /**
   * Search for NBA game highlights
   */
  async searchHighlights(
    homeTeam: string,
    awayTeam: string,
    gameDate: string,
    maxResults = 10
  ): Promise<YouTubeSearchResult> {
    if (!env.youtubeApiKey) {
      throw new Error('YouTube API key not configured');
    }

    // Build search query
    const query = `${homeTeam} vs ${awayTeam} highlights ${gameDate}`;

    const searchParams = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: maxResults.toString(),
      order: 'relevance',
      videoDuration: 'medium', // 4-20 minutes
      videoEmbeddable: 'true',
      key: env.youtubeApiKey,
    });

    const searchUrl = `${YOUTUBE_API_BASE}/search?${searchParams}`;
    const searchResponse = await fetch(searchUrl);

    if (!searchResponse.ok) {
      const error: any = await searchResponse.json();
      throw new Error(`YouTube API error: ${error.error?.message || 'Unknown error'}`);
    }

    const searchData: any = await searchResponse.json();

    if (!searchData.items || searchData.items.length === 0) {
      return {
        videos: [],
        totalResults: 0,
      };
    }

    // Get video IDs to fetch additional details
    const videoIds = searchData.items.map((item: any) => item.id.videoId);

    // Fetch video details (duration, view count, etc.)
    const detailsParams = new URLSearchParams({
      part: 'snippet,contentDetails,statistics',
      id: videoIds.join(','),
      key: env.youtubeApiKey,
    });

    const detailsUrl = `${YOUTUBE_API_BASE}/videos?${detailsParams}`;
    const detailsResponse = await fetch(detailsUrl);

    if (!detailsResponse.ok) {
      const error: any = await detailsResponse.json();
      throw new Error(`YouTube API error: ${error.error?.message || 'Unknown error'}`);
    }

    const detailsData: any = await detailsResponse.json();

    // Map to our format
    const videos: YouTubeVideo[] = detailsData.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      thumbnails: item.snippet.thumbnails,
      duration: item.contentDetails.duration,
      viewCount: item.statistics?.viewCount,
      likeCount: item.statistics?.likeCount,
    }));

    return {
      videos,
      totalResults: searchData.pageInfo.totalResults,
      nextPageToken: searchData.nextPageToken,
    };
  },

  /**
   * Get video details by ID
   */
  async getVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
    if (!env.youtubeApiKey) {
      throw new Error('YouTube API key not configured');
    }

    const params = new URLSearchParams({
      part: 'snippet,contentDetails,statistics',
      id: videoId,
      key: env.youtubeApiKey,
    });

    const url = `${YOUTUBE_API_BASE}/videos?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error: any = await response.json();
      throw new Error(`YouTube API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data: any = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const item = data.items[0];

    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      channelId: item.snippet.channelId,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      thumbnails: item.snippet.thumbnails,
      duration: item.contentDetails.duration,
      viewCount: item.statistics?.viewCount,
      likeCount: item.statistics?.likeCount,
    };
  },

  /**
   * Check if a channel is verified (NBA, ESPN, Bleacher Report, etc.)
   */
  isVerifiedChannel(channelId: string, channelTitle: string): boolean {
    const verifiedChannelIds = [
      'UCWJ2lWNubArHWmf3FIHbfcQ', // NBA
      'UCiWLfSweyRNmLpgEHekhoAg', // Bleacher Report
      'UCmKcEj5sGwhoKN5KL7F7Y5Q', // ESPN
      'UCLlGpZK4bpd5dIgmWlJC5qA', // Golden State Warriors
      // Add more official channels as needed
    ];

    const verifiedTitles = ['NBA', 'ESPN', 'Bleacher Report', 'BR', 'Official'];

    return (
      verifiedChannelIds.includes(channelId) ||
      verifiedTitles.some((title) => channelTitle.includes(title))
    );
  },

  /**
   * Parse ISO 8601 duration to seconds
   */
  parseDuration,

  /**
   * Build YouTube embed URL
   */
  getEmbedUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}`;
  },

  /**
   * Build YouTube watch URL
   */
  getWatchUrl(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`;
  },
};
