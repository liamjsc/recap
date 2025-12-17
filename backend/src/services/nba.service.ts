import { env } from '../config/env';

export interface NBATeam {
  id: number;
  abbreviation: string;
  city: string;
  conference: string;
  division: string;
  full_name: string;
  name: string;
}

export interface NBAGame {
  id: number;
  date: string; // YYYY-MM-DD format
  season: number;
  status: string;
  period: number;
  time: string;
  postseason: boolean;
  home_team: NBATeam;
  home_team_score: number;
  visitor_team: NBATeam;
  visitor_team_score: number;
}

export interface NBAGamesResponse {
  data: NBAGame[];
  meta: {
    total_pages: number;
    current_page: number;
    next_page: number | null;
    per_page: number;
    total_count: number;
  };
}

/**
 * NBA Schedule API Service (balldontlie.io)
 * Requires API key authentication (get free key at app.balldontlie.io)
 */
export const nbaService = {
  /**
   * Get headers for API requests (with optional auth)
   */
  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (env.nbaApiKey) {
      headers['Authorization'] = env.nbaApiKey;
    }
    return headers;
  },

  /**
   * Get games for a specific date range
   */
  async getGamesByDateRange(startDate: string, endDate: string): Promise<NBAGame[]> {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      per_page: '100',
    });

    const url = `${env.nbaApiUrl}/games?${params}`;
    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      throw new Error(`NBA API error: ${response.statusText}`);
    }

    const data = await response.json() as NBAGamesResponse;
    return data.data;
  },

  /**
   * Get games for a specific date
   */
  async getGamesByDate(date: string): Promise<NBAGame[]> {
    return this.getGamesByDateRange(date, date);
  },

  /**
   * Get games for a specific team
   */
  async getGamesByTeam(teamId: number, season?: number): Promise<NBAGame[]> {
    const params = new URLSearchParams({
      'team_ids[]': teamId.toString(),
      per_page: '100',
    });

    if (season) {
      params.append('seasons[]', season.toString());
    }

    const url = `${env.nbaApiUrl}/games?${params}`;
    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      throw new Error(`NBA API error: ${response.statusText}`);
    }

    const data = await response.json() as NBAGamesResponse;
    return data.data;
  },

  /**
   * Get all NBA teams
   */
  async getAllTeams(): Promise<NBATeam[]> {
    const url = `${env.nbaApiUrl}/teams?per_page=30`;
    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      throw new Error(`NBA API error: ${response.statusText}`);
    }

    const data: any = await response.json();
    return data.data;
  },

  /**
   * Get team by ID
   */
  async getTeamById(teamId: number): Promise<NBATeam | null> {
    const url = `${env.nbaApiUrl}/teams/${teamId}`;
    const response = await fetch(url, { headers: this.getHeaders() });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`NBA API error: ${response.statusText}`);
    }

    const data: any = await response.json();
    return data as NBATeam;
  },

  /**
   * Get current NBA season year
   */
  getCurrentSeason(): number {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12

    // NBA season runs from October to June
    // If before October, we're in the previous season
    return month >= 10 ? year : year - 1;
  },

  /**
   * Map game status to our internal status
   */
  mapGameStatus(nbaGame: NBAGame): 'scheduled' | 'in_progress' | 'finished' {
    // NBA API status is a string like "Final", "1st Qtr", etc.
    if (nbaGame.status.includes('Final')) {
      return 'finished';
    }
    if (nbaGame.period > 0) {
      return 'in_progress';
    }
    return 'scheduled';
  },

  /**
   * Format date for API (YYYY-MM-DD)
   */
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0]!;
  },

  /**
   * Get yesterday's date (for syncing completed games)
   */
  getYesterday(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.formatDate(yesterday);
  },

  /**
   * Get today's date
   */
  getToday(): string {
    return this.formatDate(new Date());
  },

  /**
   * Get date range for next N days
   */
  getUpcomingDateRange(days: number): { start: string; end: string } {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return {
      start: this.formatDate(today),
      end: this.formatDate(endDate),
    };
  },
};
