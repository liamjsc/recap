import { Router } from 'express';
import { teamsRepository, gamesRepository, videosRepository } from '../../db/repositories';
import { NotFoundError } from '../../middleware/errorHandler';
import type { TeamResponse, TeamBriefResponse, GameResponse, VideoResponse } from '../../types';

const router = Router();

// Helper to map team to response
const mapTeamToResponse = (team: any): TeamResponse => ({
  id: team.id,
  name: team.name,
  fullName: team.fullName,
  abbreviation: team.abbreviation,
  conference: team.conference,
  division: team.division,
});

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

// GET /api/teams - List all teams
router.get('/', async (_req, res, next) => {
  try {
    const teams = await teamsRepository.findAll();
    const response: TeamResponse[] = teams.map(mapTeamToResponse);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/teams/:id - Get team by ID
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw new NotFoundError('Team not found');
    }

    const team = await teamsRepository.findById(id);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    res.json(mapTeamToResponse(team));
  } catch (error) {
    next(error);
  }
});

// GET /api/teams/abbr/:abbreviation - Get team by abbreviation
router.get('/abbr/:abbreviation', async (req, res, next) => {
  try {
    const abbreviation = req.params.abbreviation.toUpperCase();
    const team = await teamsRepository.findByAbbreviation(abbreviation);

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    res.json(mapTeamToResponse(team));
  } catch (error) {
    next(error);
  }
});

// GET /api/teams/:id/games - Get games for a team
router.get('/:id/games', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      throw new NotFoundError('Team not found');
    }

    const team = await teamsRepository.findById(id);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    const limit = parseInt(req.query.limit as string, 10) || 50;
    const games = await gamesRepository.findByTeamId(id, limit);

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

export default router;
