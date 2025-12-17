import { gamesRepository, videosRepository } from '../db/repositories';
import { youtubeService } from './youtube.service';

export interface DiscoveryResult {
  gameId: number;
  videoId?: number;
  success: boolean;
  error?: string;
  youtubeVideoId?: string;
}

/**
 * Video Discovery Service
 * Finds and associates YouTube highlight videos with NBA games
 */
export const videoDiscoveryService = {
  /**
   * Discover and save video for a specific game
   */
  async discoverVideoForGame(gameId: number): Promise<DiscoveryResult> {
    try {
      // Check if video already exists
      const existingVideo = await videosRepository.findByGameId(gameId);
      if (existingVideo) {
        return {
          gameId,
          videoId: existingVideo.id,
          success: true,
          youtubeVideoId: existingVideo.youtubeVideoId,
        };
      }

      // Get game details
      const game = await gamesRepository.findById(gameId);
      if (!game) {
        return {
          gameId,
          success: false,
          error: 'Game not found',
        };
      }

      // Only search for finished games
      if (game.status !== 'finished') {
        return {
          gameId,
          success: false,
          error: 'Game not finished yet',
        };
      }

      // Get team names
      const homeTeam = game.homeTeam.name;
      const awayTeam = game.awayTeam.name;
      const gameDate = new Date(game.gameDate).toISOString().split('T')[0];

      // Search YouTube for highlights
      const searchResults = await youtubeService.searchHighlights(
        homeTeam,
        awayTeam,
        gameDate!,
        5 // Get top 5 results
      );

      if (searchResults.videos.length === 0) {
        return {
          gameId,
          success: false,
          error: 'No highlights found',
        };
      }

      // Pick the best video (first verified channel or first result)
      let bestVideo = searchResults.videos.find((video) =>
        youtubeService.isVerifiedChannel(video.channelId, video.channelTitle)
      );

      if (!bestVideo) {
        bestVideo = searchResults.videos[0];
      }

      if (!bestVideo) {
        return {
          gameId,
          success: false,
          error: 'No suitable video found',
        };
      }

      // Save to database
      const durationSeconds = youtubeService.parseDuration(bestVideo.duration);
      const isVerified = youtubeService.isVerifiedChannel(
        bestVideo.channelId,
        bestVideo.channelTitle
      );

      const savedVideo = await videosRepository.create({
        gameId,
        youtubeVideoId: bestVideo.id,
        title: bestVideo.title,
        channelName: bestVideo.channelTitle,
        channelId: bestVideo.channelId,
        durationSeconds,
        thumbnailUrl: bestVideo.thumbnails.high?.url || bestVideo.thumbnails.medium.url,
        publishedAt: new Date(bestVideo.publishedAt),
        viewCount: bestVideo.viewCount ? parseInt(bestVideo.viewCount, 10) : undefined,
        url: youtubeService.getWatchUrl(bestVideo.id),
        isVerified,
      });

      return {
        gameId,
        videoId: savedVideo.id,
        success: true,
        youtubeVideoId: savedVideo.youtubeVideoId,
      };
    } catch (error) {
      return {
        gameId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Discover videos for all finished games without videos
   */
  async discoverVideosForFinishedGames(limit = 20): Promise<DiscoveryResult[]> {
    try {
      // Get finished games without videos
      const finishedGames = await gamesRepository.findByStatus('finished', limit);

      const gamesWithoutVideos = [];
      for (const game of finishedGames) {
        const video = await videosRepository.findByGameId(game.id);
        if (!video) {
          gamesWithoutVideos.push(game);
        }
      }

      if (gamesWithoutVideos.length === 0) {
        return [];
      }

      console.log(`Discovering videos for ${gamesWithoutVideos.length} games...`);

      // Process each game
      const results: DiscoveryResult[] = [];
      for (const game of gamesWithoutVideos) {
        console.log(`Processing game ${game.id}: ${game.homeTeam.name} vs ${game.awayTeam.name}`);
        const result = await this.discoverVideoForGame(game.id);
        results.push(result);

        // Add delay to respect YouTube API rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const successful = results.filter((r) => r.success).length;
      console.log(`Discovered ${successful}/${results.length} videos`);

      return results;
    } catch (error) {
      console.error('Error in discoverVideosForFinishedGames:', error);
      throw error;
    }
  },

  /**
   * Discover videos for games from yesterday
   */
  async discoverVideosForYesterday(): Promise<DiscoveryResult[]> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const nextDay = new Date(yesterday);
      nextDay.setDate(nextDay.getDate() + 1);

      // Get yesterday's games
      const games = await gamesRepository.findByDateRange(yesterday, nextDay);
      const finishedGames = games.filter((g) => g.status === 'finished');

      console.log(`Found ${finishedGames.length} finished games from yesterday`);

      const results: DiscoveryResult[] = [];
      for (const game of finishedGames) {
        const result = await this.discoverVideoForGame(game.id);
        results.push(result);

        // Add delay to respect YouTube API rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      return results;
    } catch (error) {
      console.error('Error in discoverVideosForYesterday:', error);
      throw error;
    }
  },

  /**
   * Update view counts for existing videos
   */
  async updateVideoStats(videoId: number): Promise<boolean> {
    try {
      const video = await videosRepository.findById(videoId);
      if (!video) {
        return false;
      }

      const details = await youtubeService.getVideoDetails(video.youtubeVideoId);
      if (!details) {
        return false;
      }

      await videosRepository.update(videoId, {
        viewCount: details.viewCount ? parseInt(details.viewCount, 10) : undefined,
      });

      return true;
    } catch (error) {
      console.error(`Error updating video ${videoId} stats:`, error);
      return false;
    }
  },

  /**
   * Refresh stats for all videos
   */
  async refreshAllVideoStats(limit = 50): Promise<number> {
    try {
      const videos = await videosRepository.findAll(limit, 0);
      let updated = 0;

      for (const video of videos) {
        const success = await this.updateVideoStats(video.id);
        if (success) {
          updated++;
        }

        // Add delay to respect YouTube API rate limits
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      console.log(`Updated stats for ${updated}/${videos.length} videos`);
      return updated;
    } catch (error) {
      console.error('Error in refreshAllVideoStats:', error);
      throw error;
    }
  },
};
