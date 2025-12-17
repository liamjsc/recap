import { Router, Request, Response, NextFunction } from 'express';
import { env } from '../../config/env';
import { UnauthorizedError, ForbiddenError } from '../../middleware/errorHandler';

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

// POST /api/admin/fetch-schedule
router.post('/fetch-schedule', async (_req, res) => {
  res.json({
    success: true,
    message: 'Schedule sync - coming soon',
    result: {
      gamesAdded: 0,
      gamesUpdated: 0,
      errors: 0,
    },
  });
});

// POST /api/admin/fetch-videos
router.post('/fetch-videos', async (_req, res) => {
  res.json({
    success: true,
    message: 'Video discovery - coming soon',
    result: {
      gamesProcessed: 0,
      videosFound: 0,
      videosFailed: 0,
    },
  });
});

// POST /api/admin/fetch-video/:gameId
router.post('/fetch-video/:gameId', async (req, res) => {
  res.json({
    success: true,
    message: `Video fetch for game ${req.params.gameId} - coming soon`,
    video: null,
  });
});

export default router;
