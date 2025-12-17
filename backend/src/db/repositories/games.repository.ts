import { db } from '../index';

export interface Game {
  id: number;
  externalId: string | null;
  gameDate: Date;
  gameTime: Date | null;
  homeTeamId: number;
  awayTeamId: number;
  status: 'scheduled' | 'in_progress' | 'finished';
  homeScore: number | null;
  awayScore: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameWithTeams extends Game {
  homeTeam: {
    id: number;
    name: string;
    abbreviation: string;
  };
  awayTeam: {
    id: number;
    name: string;
    abbreviation: string;
  };
}

export interface CreateGameInput {
  externalId?: string;
  gameDate: Date;
  gameTime?: Date;
  homeTeamId: number;
  awayTeamId: number;
  status?: 'scheduled' | 'in_progress' | 'finished';
  homeScore?: number;
  awayScore?: number;
}

export interface UpdateGameInput {
  gameDate?: Date;
  gameTime?: Date;
  status?: 'scheduled' | 'in_progress' | 'finished';
  homeScore?: number;
  awayScore?: number;
}

export const gamesRepository = {
  /**
   * Find all games with team details
   */
  async findAll(limit = 100, offset = 0): Promise<GameWithTeams[]> {
    const result = await db.query<GameWithTeams>(
      `SELECT
        g.id, g.external_id as "externalId", g.game_date as "gameDate",
        g.game_time as "gameTime", g.status, g.home_score as "homeScore",
        g.away_score as "awayScore", g.created_at as "createdAt", g.updated_at as "updatedAt",
        g.home_team_id as "homeTeamId", g.away_team_id as "awayTeamId",
        jsonb_build_object('id', ht.id, 'name', ht.name, 'abbreviation', ht.abbreviation) as "homeTeam",
        jsonb_build_object('id', at.id, 'name', at.name, 'abbreviation', at.abbreviation) as "awayTeam"
       FROM games g
       JOIN teams ht ON g.home_team_id = ht.id
       JOIN teams at ON g.away_team_id = at.id
       ORDER BY g.game_date DESC, g.game_time DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  /**
   * Find game by ID with team details
   */
  async findById(id: number): Promise<GameWithTeams | null> {
    const result = await db.query<GameWithTeams>(
      `SELECT
        g.id, g.external_id as "externalId", g.game_date as "gameDate",
        g.game_time as "gameTime", g.status, g.home_score as "homeScore",
        g.away_score as "awayScore", g.created_at as "createdAt", g.updated_at as "updatedAt",
        g.home_team_id as "homeTeamId", g.away_team_id as "awayTeamId",
        jsonb_build_object('id', ht.id, 'name', ht.name, 'abbreviation', ht.abbreviation) as "homeTeam",
        jsonb_build_object('id', at.id, 'name', at.name, 'abbreviation', at.abbreviation) as "awayTeam"
       FROM games g
       JOIN teams ht ON g.home_team_id = ht.id
       JOIN teams at ON g.away_team_id = at.id
       WHERE g.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Find game by external ID
   */
  async findByExternalId(externalId: string): Promise<Game | null> {
    const result = await db.query<Game>(
      `SELECT id, external_id as "externalId", game_date as "gameDate",
              game_time as "gameTime", home_team_id as "homeTeamId",
              away_team_id as "awayTeamId", status, home_score as "homeScore",
              away_score as "awayScore", created_at as "createdAt", updated_at as "updatedAt"
       FROM games
       WHERE external_id = $1`,
      [externalId]
    );
    return result.rows[0] || null;
  },

  /**
   * Find games by date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<GameWithTeams[]> {
    const result = await db.query<GameWithTeams>(
      `SELECT
        g.id, g.external_id as "externalId", g.game_date as "gameDate",
        g.game_time as "gameTime", g.status, g.home_score as "homeScore",
        g.away_score as "awayScore", g.created_at as "createdAt", g.updated_at as "updatedAt",
        g.home_team_id as "homeTeamId", g.away_team_id as "awayTeamId",
        jsonb_build_object('id', ht.id, 'name', ht.name, 'abbreviation', ht.abbreviation) as "homeTeam",
        jsonb_build_object('id', at.id, 'name', at.name, 'abbreviation', at.abbreviation) as "awayTeam"
       FROM games g
       JOIN teams ht ON g.home_team_id = ht.id
       JOIN teams at ON g.away_team_id = at.id
       WHERE g.game_date BETWEEN $1 AND $2
       ORDER BY g.game_date DESC, g.game_time DESC`,
      [startDate, endDate]
    );
    return result.rows;
  },

  /**
   * Find games by team ID
   */
  async findByTeamId(teamId: number, limit = 50): Promise<GameWithTeams[]> {
    const result = await db.query<GameWithTeams>(
      `SELECT
        g.id, g.external_id as "externalId", g.game_date as "gameDate",
        g.game_time as "gameTime", g.status, g.home_score as "homeScore",
        g.away_score as "awayScore", g.created_at as "createdAt", g.updated_at as "updatedAt",
        g.home_team_id as "homeTeamId", g.away_team_id as "awayTeamId",
        jsonb_build_object('id', ht.id, 'name', ht.name, 'abbreviation', ht.abbreviation) as "homeTeam",
        jsonb_build_object('id', at.id, 'name', at.name, 'abbreviation', at.abbreviation) as "awayTeam"
       FROM games g
       JOIN teams ht ON g.home_team_id = ht.id
       JOIN teams at ON g.away_team_id = at.id
       WHERE g.home_team_id = $1 OR g.away_team_id = $1
       ORDER BY g.game_date DESC, g.game_time DESC
       LIMIT $2`,
      [teamId, limit]
    );
    return result.rows;
  },

  /**
   * Find games by status
   */
  async findByStatus(status: 'scheduled' | 'in_progress' | 'finished', limit = 100): Promise<GameWithTeams[]> {
    const result = await db.query<GameWithTeams>(
      `SELECT
        g.id, g.external_id as "externalId", g.game_date as "gameDate",
        g.game_time as "gameTime", g.status, g.home_score as "homeScore",
        g.away_score as "awayScore", g.created_at as "createdAt", g.updated_at as "updatedAt",
        g.home_team_id as "homeTeamId", g.away_team_id as "awayTeamId",
        jsonb_build_object('id', ht.id, 'name', ht.name, 'abbreviation', ht.abbreviation) as "homeTeam",
        jsonb_build_object('id', at.id, 'name', at.name, 'abbreviation', at.abbreviation) as "awayTeam"
       FROM games g
       JOIN teams ht ON g.home_team_id = ht.id
       JOIN teams at ON g.away_team_id = at.id
       WHERE g.status = $1
       ORDER BY g.game_date DESC, g.game_time DESC
       LIMIT $2`,
      [status, limit]
    );
    return result.rows;
  },

  /**
   * Create a new game
   */
  async create(input: CreateGameInput): Promise<Game> {
    const result = await db.query<Game>(
      `INSERT INTO games (external_id, game_date, game_time, home_team_id, away_team_id, status, home_score, away_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, external_id as "externalId", game_date as "gameDate",
                 game_time as "gameTime", home_team_id as "homeTeamId",
                 away_team_id as "awayTeamId", status, home_score as "homeScore",
                 away_score as "awayScore", created_at as "createdAt", updated_at as "updatedAt"`,
      [
        input.externalId || null,
        input.gameDate,
        input.gameTime || null,
        input.homeTeamId,
        input.awayTeamId,
        input.status || 'scheduled',
        input.homeScore || null,
        input.awayScore || null,
      ]
    );
    if (!result.rows[0]) {
      throw new Error('Failed to create game');
    }
    return result.rows[0];
  },

  /**
   * Update a game
   */
  async update(id: number, input: UpdateGameInput): Promise<Game | null> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.gameDate !== undefined) {
      updates.push(`game_date = $${paramIndex++}`);
      values.push(input.gameDate);
    }
    if (input.gameTime !== undefined) {
      updates.push(`game_time = $${paramIndex++}`);
      values.push(input.gameTime);
    }
    if (input.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(input.status);
    }
    if (input.homeScore !== undefined) {
      updates.push(`home_score = $${paramIndex++}`);
      values.push(input.homeScore);
    }
    if (input.awayScore !== undefined) {
      updates.push(`away_score = $${paramIndex++}`);
      values.push(input.awayScore);
    }

    if (updates.length === 0) {
      const game = await this.findById(id);
      return game ? {
        id: game.id,
        externalId: game.externalId,
        gameDate: game.gameDate,
        gameTime: game.gameTime,
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
        status: game.status,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
      } : null;
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await db.query<Game>(
      `UPDATE games
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, external_id as "externalId", game_date as "gameDate",
                 game_time as "gameTime", home_team_id as "homeTeamId",
                 away_team_id as "awayTeamId", status, home_score as "homeScore",
                 away_score as "awayScore", created_at as "createdAt", updated_at as "updatedAt"`,
      values
    );

    return result.rows[0] || null;
  },

  /**
   * Delete a game
   */
  async delete(id: number): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM games WHERE id = $1',
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  },

  /**
   * Count total games
   */
  async count(): Promise<number> {
    const result = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM games'
    );
    if (!result.rows[0]) {
      return 0;
    }
    return parseInt(result.rows[0].count, 10);
  },
};
