# Task: Implement User Preferences (LocalStorage)

## Task ID
`phase-5/006-user-preferences`

## Description
Add client-side user preferences stored in localStorage, including last visited team and default browse mode.

## Prerequisites
- `phase-5/005-loading-error-states` completed

## Expected Outcomes
1. User preferences persisted in localStorage
2. Last visited team remembered and easily accessible
3. Default browse mode (team/date) saved
4. Preferences hook for easy access throughout app

## Deliverables

### File Structure
```
frontend/src/
├── hooks/
│   └── usePreferences.ts
├── utils/
│   └── storage.ts
```

### Storage Utility
```typescript
// frontend/src/utils/storage.ts

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

    // Update last visited
    prefs.lastVisitedTeam = team;

    // Update recent teams (keep last 5, no duplicates)
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
```

### Preferences Hook
```typescript
// frontend/src/hooks/usePreferences.ts

import { useState, useEffect, useCallback } from 'react';
import { storage, UserPreferences } from '../utils/storage';

export function usePreferences() {
  const [preferences, setPreferencesState] = useState<UserPreferences>(
    storage.getPreferences()
  );

  // Sync with localStorage on mount
  useEffect(() => {
    setPreferencesState(storage.getPreferences());
  }, []);

  const setLastVisitedTeam = useCallback(
    (team: { abbreviation: string; name: string }) => {
      storage.setLastVisitedTeam(team);
      setPreferencesState(storage.getPreferences());
    },
    []
  );

  const setDefaultBrowseMode = useCallback((mode: 'team' | 'date') => {
    storage.setPreferences({ defaultBrowseMode: mode });
    setPreferencesState(storage.getPreferences());
  }, []);

  const clearPreferences = useCallback(() => {
    storage.clearPreferences();
    setPreferencesState(storage.getPreferences());
  }, []);

  return {
    preferences,
    setLastVisitedTeam,
    setDefaultBrowseMode,
    clearPreferences,
  };
}
```

### Update Team Page to Track Visit
```typescript
// frontend/src/pages/TeamPage.tsx (update)

import { usePreferences } from '../hooks/usePreferences';

export function TeamPage() {
  const { abbreviation } = useParams<{ abbreviation: string }>();
  const { team, games, loading, error } = useTeamGames(abbreviation || '');
  const { setLastVisitedTeam } = usePreferences();

  // Track team visit when loaded
  useEffect(() => {
    if (team) {
      setLastVisitedTeam({
        abbreviation: team.abbreviation,
        name: team.name,
      });
    }
  }, [team, setLastVisitedTeam]);

  // ... rest of component
}
```

### Update Home Page with Preferences
```typescript
// frontend/src/pages/HomePage.tsx (update)

import { usePreferences } from '../hooks/usePreferences';

export function HomePage() {
  const navigate = useNavigate();
  const { preferences, setDefaultBrowseMode } = usePreferences();
  const [browseMode, setBrowseMode] = useState<'team' | 'date'>(
    preferences.defaultBrowseMode
  );

  const handleModeChange = (mode: 'team' | 'date') => {
    setBrowseMode(mode);
    setDefaultBrowseMode(mode);
  };

  // ... rest of component

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Recent Teams Quick Access */}
        {preferences.recentTeams.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Recently Viewed
            </h2>
            <div className="flex gap-2 flex-wrap">
              {preferences.recentTeams.map((team) => (
                <button
                  key={team.abbreviation}
                  onClick={() =>
                    navigate(`/team/${team.abbreviation.toLowerCase()}`)
                  }
                  className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition text-sm font-medium"
                >
                  {team.abbreviation} - {team.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Browse Mode Selector */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => handleModeChange('team')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              browseMode === 'team'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Browse by Team
          </button>
          <button
            onClick={() => handleModeChange('date')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              browseMode === 'date'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Browse by Date
          </button>
        </div>

        {/* Content */}
        {browseMode === 'team' ? (
          <TeamGrid onTeamSelect={handleTeamSelect} />
        ) : (
          <DatePicker onDateSelect={handleDateSelect} />
        )}
      </div>
    </div>
  );
}
```

### Update Header with Quick Access
```typescript
// frontend/src/components/Header.tsx (update)

import { usePreferences } from '../hooks/usePreferences';

// In Header component:
function QuickTeamAccess() {
  const navigate = useNavigate();
  const { preferences } = usePreferences();

  if (!preferences.lastVisitedTeam) return null;

  return (
    <button
      onClick={() =>
        navigate(
          `/team/${preferences.lastVisitedTeam!.abbreviation.toLowerCase()}`
        )
      }
      className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-sm"
    >
      <span className="font-medium">
        {preferences.lastVisitedTeam.abbreviation}
      </span>
      <span className="text-gray-500">
        {preferences.lastVisitedTeam.name}
      </span>
    </button>
  );
}
```

### Update Mobile Menu with Recent Teams
```typescript
// frontend/src/components/MobileMenu.tsx (update)

import { usePreferences } from '../hooks/usePreferences';

// In MobileMenu component, replace static popular teams:
function MobileMenu({ isOpen, onClose }: Props) {
  const { preferences } = usePreferences();
  const navigate = useNavigate();

  // ...

  return (
    // ...
    <div className="mt-6">
      <h3 className="px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">
        {preferences.recentTeams.length > 0 ? 'Recent Teams' : 'Popular Teams'}
      </h3>
      <ul className="mt-2 space-y-1">
        {(preferences.recentTeams.length > 0
          ? preferences.recentTeams
          : [
              { abbreviation: 'LAL', name: 'Lakers' },
              { abbreviation: 'GSW', name: 'Warriors' },
              { abbreviation: 'BOS', name: 'Celtics' },
            ]
        ).map((team) => (
          <li key={team.abbreviation}>
            <button
              onClick={() => {
                navigate(`/team/${team.abbreviation.toLowerCase()}`);
                onClose();
              }}
              className="block w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
            >
              <span className="font-medium">{team.abbreviation}</span>
              <span className="ml-2 text-gray-500">{team.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
    // ...
  );
}
```

## Acceptance Criteria
- [ ] Preferences stored in localStorage
- [ ] Last visited team tracked when visiting team page
- [ ] Recent teams shown on home page
- [ ] Default browse mode remembered
- [ ] Header shows quick access to last team (desktop)
- [ ] Mobile menu shows recent teams
- [ ] Preferences persist across page reloads
- [ ] No errors when localStorage unavailable
- [ ] Clear preferences function works

## Technical Notes
- Use try/catch around localStorage (can be disabled)
- Keep recent teams list limited (5 max)
- Debounce preference saves if needed
- Consider adding theme preference for future dark mode

## Estimated Complexity
Low-Medium - LocalStorage with React state sync

## Dependencies
- Task `phase-5/005-loading-error-states`
