import { db } from '../index';

export interface Team {
  id: number;
  name: string;
  fullName: string;
  abbreviation: string;
  conference: 'Eastern' | 'Western';
  division: string;
  externalId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTeamInput {
  name: string;
  fullName: string;
  abbreviation: string;
  conference: 'Eastern' | 'Western';
  division: string;
  externalId?: number;
}

export interface UpdateTeamInput {
  name?: string;
  fullName?: string;
  conference?: 'Eastern' | 'Western';
  division?: string;
  externalId?: number;
}

export const teamsRepository = {
  /**
   * Find all teams
   */
  async findAll(): Promise<Team[]> {
    const result = await db.query<Team>(
      `SELECT id, name, full_name as "fullName", abbreviation, conference, division,
              external_id as "externalId", created_at as "createdAt", updated_at as "updatedAt"
       FROM teams
       ORDER BY conference, division, abbreviation`
    );
    return result.rows;
  },

  /**
   * Find team by ID
   */
  async findById(id: number): Promise<Team | null> {
    const result = await db.query<Team>(
      `SELECT id, name, full_name as "fullName", abbreviation, conference, division,
              external_id as "externalId", created_at as "createdAt", updated_at as "updatedAt"
       FROM teams
       WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Find team by abbreviation
   */
  async findByAbbreviation(abbreviation: string): Promise<Team | null> {
    const result = await db.query<Team>(
      `SELECT id, name, full_name as "fullName", abbreviation, conference, division,
              external_id as "externalId", created_at as "createdAt", updated_at as "updatedAt"
       FROM teams
       WHERE abbreviation = $1`,
      [abbreviation]
    );
    return result.rows[0] || null;
  },

  /**
   * Find teams by conference
   */
  async findByConference(conference: 'Eastern' | 'Western'): Promise<Team[]> {
    const result = await db.query<Team>(
      `SELECT id, name, full_name as "fullName", abbreviation, conference, division,
              external_id as "externalId", created_at as "createdAt", updated_at as "updatedAt"
       FROM teams
       WHERE conference = $1
       ORDER BY division, abbreviation`,
      [conference]
    );
    return result.rows;
  },

  /**
   * Create a new team
   */
  async create(input: CreateTeamInput): Promise<Team> {
    const result = await db.query<Team>(
      `INSERT INTO teams (name, full_name, abbreviation, conference, division, external_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, full_name as "fullName", abbreviation, conference, division,
                 external_id as "externalId", created_at as "createdAt", updated_at as "updatedAt"`,
      [input.name, input.fullName, input.abbreviation, input.conference, input.division, input.externalId || null]
    );
    if (!result.rows[0]) {
      throw new Error('Failed to create team');
    }
    return result.rows[0];
  },

  /**
   * Update a team
   */
  async update(id: number, input: UpdateTeamInput): Promise<Team | null> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(input.name);
    }
    if (input.fullName !== undefined) {
      updates.push(`full_name = $${paramIndex++}`);
      values.push(input.fullName);
    }
    if (input.conference !== undefined) {
      updates.push(`conference = $${paramIndex++}`);
      values.push(input.conference);
    }
    if (input.division !== undefined) {
      updates.push(`division = $${paramIndex++}`);
      values.push(input.division);
    }
    if (input.externalId !== undefined) {
      updates.push(`external_id = $${paramIndex++}`);
      values.push(input.externalId);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await db.query<Team>(
      `UPDATE teams
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, name, full_name as "fullName", abbreviation, conference, division,
                 external_id as "externalId", created_at as "createdAt", updated_at as "updatedAt"`,
      values
    );

    return result.rows[0] || null;
  },

  /**
   * Delete a team
   */
  async delete(id: number): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM teams WHERE id = $1',
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  },

  /**
   * Count total teams
   */
  async count(): Promise<number> {
    const result = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM teams'
    );
    if (!result.rows[0]) {
      return 0;
    }
    return parseInt(result.rows[0].count, 10);
  },
};
