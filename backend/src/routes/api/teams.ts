import { Router } from 'express';

const router = Router();

// GET /api/teams
router.get('/', async (_req, res) => {
  res.json({
    message: 'Teams endpoint - coming soon',
    teams: [],
  });
});

// GET /api/teams/:id
router.get('/:id', async (req, res) => {
  res.json({
    message: `Team ${req.params.id} endpoint - coming soon`,
    team: null,
  });
});

// GET /api/teams/abbr/:abbreviation
router.get('/abbr/:abbreviation', async (req, res) => {
  res.json({
    message: `Team ${req.params.abbreviation} endpoint - coming soon`,
    team: null,
  });
});

// GET /api/teams/:id/games
router.get('/:id/games', async (req, res) => {
  res.json({
    message: `Games for team ${req.params.id} - coming soon`,
    games: [],
  });
});

export default router;
