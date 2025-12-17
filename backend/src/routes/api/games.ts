import { Router } from 'express';
import { gamesRepository, videosRepository } from '../../db/repositories';
import { NotFoundError, BadRequestError } from '../../middleware/errorHandler';
import type { GameResponse, TeamBriefResponse, VideoResponse } from '../../types';

const router = Router();

// Helper to map team to brief response
const mapTeamToBrief = (team: any): TeamBriefResponse => ({
  id: team.id,
  name: team.name,
  abbreviation: team.abbreviation,
});

// Helper to map video to response
const mapVideoToResponse = (video: any): VideoResponse => ({
  id: video.id,
  youtubeVideoId: video.youtubeVideoId,
  title: video.title,
  thumbnailUrl: video.thumbnailUrl,
  durationSeconds: video.durationSeconds,
  channelName: video.channelName,
  isVerified: video.isVerified,
  url: video.url,
});

// GET /api/games?date=YYYY-MM-DD or ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/', async (req, res, next) => {
  try {
    const { date, startDate, endDate } = req.query;

    let games;

    if (date) {
      // Single date
      const targetDate = new Date(date as string);
      if (isNaN(targetDate.getTime())) {
        throw new BadRequestError('Invalid date format');
      }
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      games = await gamesRepository.findByDateRange(targetDate, nextDay);
    } else if (startDate && endDate) {
      // Date range
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestError('Invalid date format');
      }
      games = await gamesRepository.findByDateRange(start, end);
    } else {
      // No filters - get recent games
      const limit = parseInt(req.query.limit as string, 10) || 100;
      games = await gamesRepository.findAll(limit, 0);
    }

    // Fetch videos for games
    const gamesWithVideos = await Promise.all(
      games.map(async (game) => {
        const video = await videosRepository.findByGameId(game.id);
        return {
          ...game,
          video,
        };
      })
    );

    const response: GameResponse[] = gamesWithVideos.map((game) => ({
      id: game.id,
      gameDate: new Date(game.gameDate).toISOString().split('T')[0]!,
      gameTime: game.gameTime ? game.gameTime.toISOString() : null,
      status: game.status,
      homeTeam: mapTeamToBrief(game.homeTeam),
      awayTeam: mapTeamToBrief(game.awayTeam),
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      video: game.video ? mapVideoToResponse(game.video) : null,
    }));

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/games/:id - Get game by ID
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw new NotFoundError('Game not found');
    }

    const game = await gamesRepository.findById(id);
    if (!game) {
      throw new NotFoundError('Game not found');
    }

    // Fetch video for game
    const video = await videosRepository.findByGameId(game.id);

    const response: GameResponse = {
      id: game.id,
      gameDate: new Date(game.gameDate).toISOString().split('T')[0]!,
      gameTime: game.gameTime ? game.gameTime.toISOString() : null,
      status: game.status,
      homeTeam: mapTeamToBrief(game.homeTeam),
      awayTeam: mapTeamToBrief(game.awayTeam),
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      video: video ? mapVideoToResponse(video) : null,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
