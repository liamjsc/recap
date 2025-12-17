import { Router, Request, Response, NextFunction } from 'express';
import { env } from '../../config/env';
import { UnauthorizedError, ForbiddenError, BadRequestError } from '../../middleware/errorHandler';
import { scheduleSyncService } from '../../services/scheduleSync.service';
import { videoDiscoveryService } from '../../services/videoDiscovery.service';

const router = Router();

// Admin authentication middleware
function adminAuth(req: Request, _res: Response, next: NextFunction) {
  const apiKey = req.headers['x-admin-api-key'] as string;

  if (!apiKey) {
    throw new UnauthorizedError('Admin API key required');
  }

  if (apiKey !== env.adminApiKey) {
    throw new ForbiddenError('Invalid admin API key');
  }

  next();
}

// Apply auth to all admin routes
router.use(adminAuth);

// POST /api/admin/sync/schedule - Sync game schedules
router.post('/sync/schedule', async (req, res, next) => {
  try {
    const { range = 'upcoming' } = req.body;

    let result;
    switch (range) {
      case 'today':
        result = await scheduleSyncService.syncTodaysGames();
        break;
      case 'yesterday':
        result = await scheduleSyncService.syncYesterdaysGames();
        break;
      case 'upcoming':
        result = await scheduleSyncService.syncUpcomingWeek();
        break;
      default:
        throw new BadRequestError('Invalid range. Use: today, yesterday, or upcoming');
    }

    res.json({
      success: true,
      message: `Schedule synced for ${range}`,
      result: {
        gamesAdded: result.gamesAdded,
        gamesUpdated: result.gamesUpdated,
        errors: result.errors.length,
        errorMessages: result.errors,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/sync/scores - Update live scores
router.post('/sync/scores', async (_req, res, next) => {
  try {
    const result = await scheduleSyncService.updateLiveScores();

    res.json({
      success: true,
      message: 'Live scores updated',
      result: {
        gamesUpdated: result.gamesUpdated,
        errors: result.errors.length,
        errorMessages: result.errors,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/sync/videos - Discover videos for finished games
router.post('/sync/videos', async (req, res, next) => {
  try {
    const { scope = 'recent', limit = 20 } = req.body;

    let results;
    if (scope === 'yesterday') {
      results = await videoDiscoveryService.discoverVideosForYesterday();
    } else {
      results = await videoDiscoveryService.discoverVideosForFinishedGames(limit);
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success);

    res.json({
      success: true,
      message: 'Video discovery completed',
      result: {
        gamesProcessed: results.length,
        videosFound: successful,
        videosFailed: failed.length,
        failedGames: failed.map((r) => ({
          gameId: r.gameId,
          error: r.error,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/sync/videos/:gameId - Discover video for specific game
router.post('/sync/videos/:gameId', async (req, res, next) => {
  try {
    const gameId = parseInt(req.params.gameId, 10);
    if (isNaN(gameId)) {
      throw new BadRequestError('Invalid game ID');
    }

    const result = await videoDiscoveryService.discoverVideoForGame(gameId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.error || 'Video discovery failed',
        gameId,
      });
    }

    res.json({
      success: true,
      message: 'Video discovered and saved',
      result: {
        gameId: result.gameId,
        videoId: result.videoId,
        youtubeVideoId: result.youtubeVideoId,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/refresh/video-stats - Refresh video statistics
router.post('/refresh/video-stats', async (req, res, next) => {
  try {
    const { limit = 50 } = req.body;

    const updated = await videoDiscoveryService.refreshAllVideoStats(limit);

    res.json({
      success: true,
      message: 'Video statistics refreshed',
      result: {
        videosUpdated: updated,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/health - Admin health check with detailed stats
router.get('/health', async (_req, res, next) => {
  try {
    const { teamsRepository, gamesRepository, videosRepository } = await import('../../db/repositories');

    const [teamCount, gameCount, videoCount, verifiedCount] = await Promise.all([
      teamsRepository.count(),
      gamesRepository.count(),
      videosRepository.count(),
      videosRepository.countVerified(),
    ]);

    res.json({
      success: true,
      database: {
        teams: teamCount,
        games: gameCount,
        videos: videoCount,
        verifiedVideos: verifiedCount,
      },
      services: {
        youtube: !!env.youtubeApiKey,
        nba: !!env.nbaApiUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
