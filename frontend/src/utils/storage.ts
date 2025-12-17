const STORAGE_KEY = 'nba-highlights-preferences';

export interface UserPreferences {
  lastVisitedTeam: {
    abbreviation: string;
    name: string;
  } | null;
  defaultBrowseMode: 'team' | 'date';
  recentTeams: Array<{ abbreviation: string; name: string }>;
}

const defaultPreferences: UserPreferences = {
  lastVisitedTeam: null,
  defaultBrowseMode: 'team',
  recentTeams: [],
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

  setLastVisitedTeam(team: { abbreviation: string; name: string }): void {
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

  clearPreferences(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
