const STORAGE_KEY = 'nba-highlights-preferences';

export interface TeamRef {
  abbreviation: string;
  name: string;
}

export interface UserPreferences {
  lastVisitedTeam: TeamRef | null;
  defaultBrowseMode: 'team' | 'date';
  recentTeams: TeamRef[];
  favoriteTeams: TeamRef[];
}

const defaultPreferences: UserPreferences = {
  lastVisitedTeam: null,
  defaultBrowseMode: 'team',
  recentTeams: [],
  favoriteTeams: [],
};

export const storage = {
  getPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return defaultPreferences;

      const parsed = JSON.parse(stored);
      return { ...defaultPreferences, ...parsed };
    } catch {
      return defaultPreferences;
    }
  },

  setPreferences(prefs: Partial<UserPreferences>): void {
    try {
      const current = this.getPreferences();
      const updated = { ...current, ...prefs };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save preferences:', error);
    }
  },

  setLastVisitedTeam(team: TeamRef): void {
    const prefs = this.getPreferences();

    prefs.lastVisitedTeam = team;

    prefs.recentTeams = [
      team,
      ...prefs.recentTeams.filter(
        (t) => t.abbreviation !== team.abbreviation
      ),
    ].slice(0, 5);

    this.setPreferences(prefs);
  },

  toggleFavoriteTeam(team: TeamRef): void {
    const prefs = this.getPreferences();
    const isFavorite = prefs.favoriteTeams.some(
      (t) => t.abbreviation === team.abbreviation
    );

    if (isFavorite) {
      prefs.favoriteTeams = prefs.favoriteTeams.filter(
        (t) => t.abbreviation !== team.abbreviation
      );
    } else {
      prefs.favoriteTeams = [...prefs.favoriteTeams, team];
    }

    this.setPreferences(prefs);
  },

  isFavoriteTeam(abbreviation: string): boolean {
    const prefs = this.getPreferences();
    return prefs.favoriteTeams.some((t) => t.abbreviation === abbreviation);
  },

  clearPreferences(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
