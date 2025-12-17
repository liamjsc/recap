import { Router } from 'express';
import { env } from '../config/env';

const router = Router();

// Detailed health check
router.get('/', async (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: env.nodeEnv,
    uptime: process.uptime(),
  });
});

// Simple liveness check
router.get('/live', (_req, res) => {
  res.status(200).send('OK');
});

// Readiness check (will include DB check later)
router.get('/ready', (_req, res) => {
  res.status(200).json({ ready: true });
});

export default router;
