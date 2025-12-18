import { useState, useEffect } from 'react';
import { Hero } from '../components/Hero';
import { VideoThumbnail } from '../components/VideoThumbnail';
import { usePreferences } from '../hooks/usePreferences';
import { useFilteredGames, GameFilter } from '../hooks/useFilteredGames';
import { groupGamesByDate, formatDateHeading } from '../hooks/useRecentGames';
import { apiClient } from '../api/client';
import { Game, Team } from '../types';

export function HomePage() {
  const { preferences, setLastVisitedTeam } = usePreferences();
  const [filter, setFilter] = useState<GameFilter>({ type: 'recent' });
  const { games, team, loading, error } = useFilteredGames(filter);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);

  // Load teams for dropdown
  useEffect(() => {
    apiClient
      .get<Team[]>('/teams')
      .then(setTeams)
      .catch(() => {})
      .finally(() => setTeamsLoading(false));
  }, []);

  // Track visited team
  useEffect(() => {
    if (team) {
      setLastVisitedTeam({ abbreviation: team.abbreviation, name: team.name });
    }
  }, [team, setLastVisitedTeam]);

  const handleTeamChange = (abbreviation: string) => {
    if (abbreviation === '') {
      setFilter({ type: 'recent' });
    } else {
      setFilter({ type: 'team', abbreviation });
    }
  };

  const handleDateChange = (date: string) => {
    if (date === '') {
      setFilter({ type: 'recent' });
    } else {
      setFilter({ type: 'date', date });
    }
  };

  const clearFilter = () => {
    setFilter({ type: 'recent' });
  };

  const groupedGames = filter.type === 'recent' ? groupGamesByDate(games) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Team Dropdown */}
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Filter by Team
              </label>
              <select
                value={filter.type === 'team' ? filter.abbreviation : ''}
                onChange={(e) => handleTeamChange(e.target.value)}
                disabled={teamsLoading}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
              >
                <option value="">All Teams</option>
                {teams
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((t) => (
                    <option key={t.id} value={t.abbreviation}>
                      {t.name} ({t.abbreviation})
                    </option>
                  ))}
              </select>
            </div>

            <div className="hidden sm:block text-gray-300">|</div>

            {/* Date Picker */}
            <div className="flex-1 w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Filter by Date
              </label>
              <input
                type="date"
                value={filter.type === 'date' ? filter.date : ''}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Clear Button */}
            {filter.type !== 'recent' && (
              <button
                onClick={clearFilter}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition self-end"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Access: Recently Viewed & Favorites */}
          {(preferences.recentTeams.length > 0 ||
            preferences.favoriteTeams.length > 0) && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-2">
                {preferences.favoriteTeams.map((t) => (
                  <button
                    key={`fav-${t.abbreviation}`}
                    onClick={() => handleTeamChange(t.abbreviation)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      filter.type === 'team' &&
                      filter.abbreviation === t.abbreviation
                        ? 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-300'
                        : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                    }`}
                  >
                    <StarIcon className="w-3 h-3 fill-yellow-400" />
                    {t.abbreviation}
                  </button>
                ))}
                {preferences.recentTeams
                  .filter(
                    (t) =>
                      !preferences.favoriteTeams.some(
                        (f) => f.abbreviation === t.abbreviation
                      )
                  )
                  .map((t) => (
                    <button
                      key={`recent-${t.abbreviation}`}
                      onClick={() => handleTeamChange(t.abbreviation)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                        filter.type === 'team' &&
                        filter.abbreviation === t.abbreviation
                          ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t.abbreviation}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Active Filter Display */}
        {filter.type !== 'recent' && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {filter.type === 'team' && team
                ? `${team.fullName} Games`
                : filter.type === 'date'
                ? formatDateHeading(filter.date)
                : 'Games'}
            </h2>
            {filter.type === 'team' && team && (
              <p className="text-gray-600 mt-1">
                {team.conference} Conference - {team.division} Division
              </p>
            )}
          </div>
        )}

        {/* Games Display */}
        <GamesView
          games={games}
          groupedGames={groupedGames}
          filter={filter}
          loading={loading}
          error={error}
          onDateClick={(date) => setFilter({ type: 'date', date })}
          onTeamClick={(abbr) => setFilter({ type: 'team', abbreviation: abbr })}
        />
      </div>
    </div>
  );
}

function GamesView({
  games,
  groupedGames,
  filter,
  loading,
  error,
  onDateClick,
  onTeamClick,
}: {
  games: Game[];
  groupedGames: Map<string, Game[]> | null;
  filter: GameFilter;
  loading: boolean;
  error: string | null;
  onDateClick: (date: string) => void;
  onTeamClick: (abbreviation: string) => void;
}) {
  if (loading) {
    return <GamesSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-lg">
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

  if (games.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg">
        <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">No games found.</p>
      </div>
    );
  }

  // Grouped by date (recent view)
  if (groupedGames) {
    return (
      <div className="space-y-8">
        {Array.from(groupedGames.entries()).map(([date, dateGames]) => (
          <div key={date}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {formatDateHeading(date)}
              </h2>
              <button
                onClick={() => onDateClick(date)}
                className="text-sm text-blue-600 hover:underline"
              >
                View all
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dateGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onTeamClick={onTeamClick}
                  showDate={false}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Flat list (filtered view)
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {games.map((game) => (
        <GameCard
          key={game.id}
          game={game}
          onTeamClick={onTeamClick}
          showDate={filter.type === 'team'}
        />
      ))}
    </div>
  );
}

function GameCard({
  game,
  onTeamClick,
  showDate,
}: {
  game: Game;
  onTeamClick: (abbreviation: string) => void;
  showDate: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
      {game.video ? (
        <div className="mb-3">
          <VideoThumbnail video={game.video} />
        </div>
      ) : (
        <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center mb-3">
          <span className="text-xs text-gray-500 text-center px-2">
            {game.status === 'finished'
              ? 'Highlights coming soon'
              : game.status === 'in_progress'
              ? 'Game in progress'
              : 'Game not started'}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <button
          onClick={() => onTeamClick(game.awayTeam.abbreviation)}
          className="font-medium hover:text-blue-600 transition"
        >
          {game.awayTeam.abbreviation}
        </button>
        {game.status === 'finished' && game.awayScore !== null && (
          <span className="font-bold">{game.awayScore}</span>
        )}
        <span className="text-gray-400 px-2">@</span>
        {game.status === 'finished' && game.homeScore !== null && (
          <span className="font-bold">{game.homeScore}</span>
        )}
        <button
          onClick={() => onTeamClick(game.homeTeam.abbreviation)}
          className="font-medium hover:text-blue-600 transition"
        >
          {game.homeTeam.abbreviation}
        </button>
      </div>

      <div className="mt-2 text-xs text-gray-500 text-center">
        {showDate && (
          <span className="mr-2">
            {new Date(game.gameDate + 'T12:00:00').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
        {game.status === 'scheduled' && 'Scheduled'}
        {game.status === 'in_progress' && (
          <span className="text-orange-600 font-medium">In Progress</span>
        )}
        {game.status === 'finished' && 'Final'}
      </div>
    </div>
  );
}

function GamesSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((j) => (
              <div
                key={j}
                className="h-40 bg-gray-200 rounded-lg animate-pulse"
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
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}
