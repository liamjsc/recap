import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Team, Game } from '../types';

interface TeamGamesData {
  team: Team | null;
  games: Game[];
  loading: boolean;
  error: string | null;
}

export function useTeamGames(abbreviation: string): TeamGamesData {
  const [team, setTeam] = useState<Team | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!abbreviation) {
      setLoading(false);
      setError('No team specified');
      return;
    }

    async function fetchTeamAndGames() {
      setLoading(true);
      setError(null);

      try {
        const teamData = await apiClient.get<Team>(
          `/teams/abbr/${abbreviation.toUpperCase()}`
        );
        setTeam(teamData);

        const gamesData = await apiClient.get<Game[]>(
          `/teams/${teamData.id}/games?limit=15`
        );
        setGames(gamesData ?? []);
      } catch (err) {
        if (err instanceof Error && err.message.includes('404')) {
          setError('Team not found');
        } else {
          setError('Failed to load team data');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchTeamAndGames();
  }, [abbreviation]);

  return { team, games, loading, error };
}
