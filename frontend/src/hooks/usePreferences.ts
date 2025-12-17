import { useState, useEffect, useCallback } from 'react';
import { storage, UserPreferences } from '../utils/storage';

export function usePreferences() {
  const [preferences, setPreferencesState] = useState<UserPreferences>(
    storage.getPreferences()
  );

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
