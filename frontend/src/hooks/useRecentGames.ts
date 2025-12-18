import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Game } from '../types';

interface RecentGamesData {
  games: Game[];
  loading: boolean;
  error: string | null;
}

export function useRecentGames(limit: number = 50): RecentGamesData {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGames() {
      setLoading(true);
      setError(null);

      try {
        const data = await apiClient.get<Game[]>(`/games?limit=${limit}`);
        setGames(data ?? []);
      } catch {
        setError('Failed to load games');
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, [limit]);

  return { games, loading, error };
}

// Helper to group games by date
export function groupGamesByDate(games: Game[]): Map<string, Game[]> {
  const grouped = new Map<string, Game[]>();

  // Sort by date descending first
  const sorted = [...games].sort((a, b) =>
    b.gameDate.localeCompare(a.gameDate)
  );

  sorted.forEach((game) => {
    const date = game.gameDate;
    const existing = grouped.get(date) || [];
    grouped.set(date, [...existing, game]);
  });

  return grouped;
}

// Format date for display
export function formatDateHeading(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateNormalized = new Date(date);
  dateNormalized.setHours(0, 0, 0, 0);

  if (dateNormalized.getTime() === today.getTime()) {
    return 'Today';
  }
  if (dateNormalized.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}
