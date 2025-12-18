import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Game, Team } from '../types';

export type GameFilter =
  | { type: 'recent' }
  | { type: 'date'; date: string }
  | { type: 'team'; abbreviation: string };

interface FilteredGamesData {
  games: Game[];
  team: Team | null;
  loading: boolean;
  error: string | null;
}

export function useFilteredGames(filter: GameFilter): FilteredGamesData {
  const [games, setGames] = useState<Game[]>([]);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGames() {
      setLoading(true);
      setError(null);
      setTeam(null);

      try {
        if (filter.type === 'recent') {
          const data = await apiClient.get<Game[]>('/games?limit=50');
          setGames(data ?? []);
        } else if (filter.type === 'date') {
          const data = await apiClient.get<Game[]>(`/games?date=${filter.date}`);
          setGames(data ?? []);
        } else if (filter.type === 'team') {
          const teamData = await apiClient.get<Team>(
            `/teams/abbr/${filter.abbreviation.toUpperCase()}`
          );
          setTeam(teamData);
          const gamesData = await apiClient.get<Game[]>(
            `/teams/${teamData.id}/games?limit=30`
          );
          setGames(gamesData ?? []);
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('404')) {
          setError('Not found');
        } else {
          setError('Failed to load games');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, [filter.type, filter.type === 'date' ? filter.date : filter.type === 'team' ? filter.abbreviation : '']);

  return { games, team, loading, error };
}
