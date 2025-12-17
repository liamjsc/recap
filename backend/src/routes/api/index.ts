import { Router } from 'express';
import teamsRoutes from './teams';
import gamesRoutes from './games';
import adminRoutes from './admin';

const router = Router();

router.use('/teams', teamsRoutes);
router.use('/games', gamesRoutes);
router.use('/admin', adminRoutes);

export default router;
