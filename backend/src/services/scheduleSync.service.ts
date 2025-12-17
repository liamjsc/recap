import { gamesRepository, teamsRepository } from '../db/repositories';
import { nbaService, NBAGame } from './nba.service';

export interface SyncResult {
  gamesAdded: number;
  gamesUpdated: number;
  errors: string[];
}

/**
 * Schedule Sync Service
 * Syncs NBA game schedules from the external API to our database
 */
export const scheduleSyncService = {
  /**
   * Sync games for a specific date range
   */
  async syncGamesForDateRange(startDate: string, endDate: string): Promise<SyncResult> {
    const result: SyncResult = {
      gamesAdded: 0,
      gamesUpdated: 0,
      errors: [],
    };

    try {
      console.log(`Syncing games from ${startDate} to ${endDate}...`);

      // Fetch games from NBA API
      const nbaGames = await nbaService.getGamesByDateRange(startDate, endDate);
      console.log(`Found ${nbaGames.length} games from NBA API`);

      for (const nbaGame of nbaGames) {
        try {
          await this.syncGame(nbaGame);
          result.gamesAdded++;
        } catch (error) {
          const errorMsg = `Failed to sync game ${nbaGame.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      console.log(`Sync complete: ${result.gamesAdded} added, ${result.gamesUpdated} updated`);
    } catch (error) {
      const errorMsg = `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
    }

    return result;
  },

  /**
   * Sync games for today
   */
  async syncTodaysGames(): Promise<SyncResult> {
    const today = nbaService.getToday();
    return this.syncGamesForDateRange(today, today);
  },

  /**
   * Sync games for the upcoming week
   */
  async syncUpcomingWeek(): Promise<SyncResult> {
    const { start, end } = nbaService.getUpcomingDateRange(7);
    return this.syncGamesForDateRange(start, end);
  },

  /**
   * Sync games for yesterday (to update scores)
   */
  async syncYesterdaysGames(): Promise<SyncResult> {
    const yesterday = nbaService.getYesterday();
    return this.syncGamesForDateRange(yesterday, yesterday);
  },

  /**
   * Sync a single game from NBA API data
   */
  async syncGame(nbaGame: NBAGame): Promise<void> {
    // Map NBA team IDs to our database team IDs
    const homeTeam = await this.findOrCreateTeamByExternalId(nbaGame.home_team.id);
    const awayTeam = await this.findOrCreateTeamByExternalId(nbaGame.visitor_team.id);

    if (!homeTeam || !awayTeam) {
      throw new Error(`Teams not found: ${nbaGame.home_team.id}, ${nbaGame.visitor_team.id}`);
    }

    // Check if game already exists by external ID
    const existingGame = await gamesRepository.findByExternalId(nbaGame.id.toString());

    // Parse date as local midnight to avoid timezone shifts
    // nbaGame.date is "YYYY-MM-DD" format
    const [year, month, day] = nbaGame.date.split('-').map(Number);
    const gameDate = new Date(year!, month! - 1, day!);
    const status = nbaService.mapGameStatus(nbaGame);

    if (existingGame) {
      // Update existing game
      await gamesRepository.update(existingGame.id, {
        status,
        homeScore: nbaGame.home_team_score || undefined,
        awayScore: nbaGame.visitor_team_score || undefined,
      });
    } else {
      // Create new game
      await gamesRepository.create({
        externalId: nbaGame.id.toString(),
        gameDate,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        status,
        homeScore: nbaGame.home_team_score || undefined,
        awayScore: nbaGame.visitor_team_score || undefined,
      });
    }
  },

  /**
   * Find or create team by external NBA API ID
   */
  async findOrCreateTeamByExternalId(externalId: number): Promise<{ id: number } | null> {
    // First, try to find by external ID
    const teams = await teamsRepository.findAll();
    const team = teams.find((t) => t.externalId === externalId);

    if (team) {
      return { id: team.id };
    }

    // If not found, fetch from NBA API and create
    try {
      const nbaTeam = await nbaService.getTeamById(externalId);
      if (!nbaTeam) {
        return null;
      }

      // Check if team exists by abbreviation
      const existingTeam = await teamsRepository.findByAbbreviation(nbaTeam.abbreviation);
      if (existingTeam) {
        // Update external ID
        const updated = await teamsRepository.update(existingTeam.id, {
          externalId,
        });
        return updated ? { id: updated.id } : null;
      }

      // Create new team
      const newTeam = await teamsRepository.create({
        name: nbaTeam.name,
        fullName: nbaTeam.full_name,
        abbreviation: nbaTeam.abbreviation,
        conference: nbaTeam.conference as 'Eastern' | 'Western',
        division: nbaTeam.division,
        externalId,
      });

      return { id: newTeam.id };
    } catch (error) {
      console.error(`Failed to create team ${externalId}:`, error);
      return null;
    }
  },

  /**
   * Update scores for in-progress and recently finished games
   */
  async updateLiveScores(): Promise<SyncResult> {
    const result: SyncResult = {
      gamesAdded: 0,
      gamesUpdated: 0,
      errors: [],
    };

    try {
      // Get today's games
      const today = nbaService.getToday();
      const nbaGames = await nbaService.getGamesByDate(today);

      for (const nbaGame of nbaGames) {
        try {
          const existingGame = await gamesRepository.findByExternalId(nbaGame.id.toString());
          if (existingGame) {
            const status = nbaService.mapGameStatus(nbaGame);
            await gamesRepository.update(existingGame.id, {
              status,
              homeScore: nbaGame.home_team_score || undefined,
              awayScore: nbaGame.visitor_team_score || undefined,
            });
            result.gamesUpdated++;
          }
        } catch (error) {
          const errorMsg = `Failed to update game ${nbaGame.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
        }
      }

      console.log(`Updated ${result.gamesUpdated} live scores`);
    } catch (error) {
      const errorMsg = `Live score update failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
    }

    return result;
  },
};
