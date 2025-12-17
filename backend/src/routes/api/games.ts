import { Router } from 'express';

const router = Router();

// GET /api/games/date/:date
router.get('/date/:date', async (req, res) => {
  res.json({
    message: `Games for date ${req.params.date} - coming soon`,
    date: req.params.date,
    games: [],
  });
});

// GET /api/games/:id
router.get('/:id', async (req, res) => {
  res.json({
    message: `Game ${req.params.id} endpoint - coming soon`,
    game: null,
  });
});

export default router;
