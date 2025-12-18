import { useState, useEffect, useCallback } from 'react';
import { storage, UserPreferences, TeamRef } from '../utils/storage';

export function usePreferences() {
  const [preferences, setPreferencesState] = useState<UserPreferences>(
    storage.getPreferences()
  );

  useEffect(() => {
    setPreferencesState(storage.getPreferences());
  }, []);

  const setLastVisitedTeam = useCallback((team: TeamRef) => {
    storage.setLastVisitedTeam(team);
    setPreferencesState(storage.getPreferences());
  }, []);

  const setDefaultBrowseMode = useCallback((mode: 'team' | 'date') => {
    storage.setPreferences({ defaultBrowseMode: mode });
    setPreferencesState(storage.getPreferences());
  }, []);

  const toggleFavoriteTeam = useCallback((team: TeamRef) => {
    storage.toggleFavoriteTeam(team);
    setPreferencesState(storage.getPreferences());
  }, []);

  const isFavoriteTeam = useCallback((abbreviation: string) => {
    return storage.isFavoriteTeam(abbreviation);
  }, []);

  const clearPreferences = useCallback(() => {
    storage.clearPreferences();
    setPreferencesState(storage.getPreferences());
  }, []);

  return {
    preferences,
    setLastVisitedTeam,
    setDefaultBrowseMode,
    toggleFavoriteTeam,
    isFavoriteTeam,
    clearPreferences,
  };
}
