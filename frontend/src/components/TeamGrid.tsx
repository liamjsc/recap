import { useEffect, useState } from 'react';
import { TeamCard } from './TeamCard';
import { apiClient } from '../api/client';
import { Team, Game } from '../types';
import { usePreferences } from '../hooks/usePreferences';

interface Props {
  onTeamSelect: (abbreviation: string) => void;
}

export function TeamGrid({ onTeamSelect }: Props) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [todaysGames, setTodaysGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'Eastern' | 'Western'>('all');
  const { preferences, toggleFavoriteTeam } = usePreferences();

  useEffect(() => {
    async function loadData() {
      try {
        const today = new Date().toISOString().split('T')[0];
        const [teamsData, gamesData] = await Promise.all([
          apiClient.get<Team[]>('/teams'),
          apiClient.get<Game[]>(`/games?date=${today}`),
        ]);
        setTeams(teamsData);
        setTodaysGames(gamesData ?? []);
      } catch {
        setError('Failed to load teams');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Get abbreviations of teams playing today
  const teamsPlayingToday = new Set<string>();
  todaysGames.forEach((game) => {
    teamsPlayingToday.add(game.homeTeam.abbreviation);
    teamsPlayingToday.add(game.awayTeam.abbreviation);
  });

  // Get favorite teams that have games today
  const favoriteTeamsWithGamesToday = preferences.favoriteTeams.filter((fav) =>
    teamsPlayingToday.has(fav.abbreviation)
  );

  const filteredTeams =
    filter === 'all' ? teams : teams.filter((t) => t.conference === filter);

  const divisions: Record<string, Team[]> = {};
  filteredTeams.forEach((team) => {
    const div = team.division;
    if (!divisions[div]) {
      divisions[div] = [];
    }
    divisions[div].push(team);
  });

  if (loading) {
    return <TeamGridSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-blue-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const handleToggleFavorite = (team: Team, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteTeam({ abbreviation: team.abbreviation, name: team.name });
  };

  const isFavorite = (abbreviation: string) =>
    preferences.favoriteTeams.some((t) => t.abbreviation === abbreviation);

  return (
    <div>
      {/* Favorite teams with games today */}
      {favoriteTeamsWithGamesToday.length > 0 && (
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
            <StarIcon className="w-5 h-5 fill-yellow-500" />
            Your Teams Playing Today
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {favoriteTeamsWithGamesToday.map((fav) => {
              const team = teams.find((t) => t.abbreviation === fav.abbreviation);
              if (!team) return null;
              return (
                <TeamCard
                  key={team.id}
                  team={team}
                  onClick={() => onTeamSelect(team.abbreviation)}
                  isFavorite={true}
                  onToggleFavorite={(e) => handleToggleFavorite(team, e)}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-center gap-2 mb-6">
        {(['all', 'Eastern', 'Western'] as const).map((conf) => (
          <button
            key={conf}
            onClick={() => setFilter(conf)}
            className={`px-4 py-2 rounded text-sm font-medium ${
              filter === conf
                ? 'bg-gray-900 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {conf === 'all' ? 'All Teams' : `${conf} Conference`}
          </button>
        ))}
      </div>

      {Object.entries(divisions)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([division, divTeams]) => (
          <div key={division} className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              {division} Division
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {divTeams
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    onClick={() => onTeamSelect(team.abbreviation)}
                    isFavorite={isFavorite(team.abbreviation)}
                    onToggleFavorite={(e) => handleToggleFavorite(team, e)}
                  />
                ))}
            </div>
          </div>
        ))}
    </div>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  );
}

function TeamGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="h-24 bg-gray-200 rounded-lg animate-pulse"
        />
      ))}
    </div>
  );
}
