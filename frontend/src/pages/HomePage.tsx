import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { TeamGrid } from '../components/TeamGrid';
import { DatePicker } from '../components/DatePicker';
import { VideoThumbnail } from '../components/VideoThumbnail';
import { usePreferences } from '../hooks/usePreferences';
import {
  useRecentGames,
  groupGamesByDate,
  formatDateHeading,
} from '../hooks/useRecentGames';
import { Game } from '../types';

type BrowseMode = 'recent' | 'team' | 'date';

export function HomePage() {
  const navigate = useNavigate();
  const { preferences, setDefaultBrowseMode } = usePreferences();
  const [browseMode, setBrowseMode] = useState<BrowseMode>('recent');
  const { games, loading, error } = useRecentGames(50);

  const handleTeamSelect = (abbreviation: string) => {
    navigate(`/team/${abbreviation.toLowerCase()}`);
  };

  const handleDateSelect = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    navigate(`/date/${dateStr}`);
  };

  const handleModeChange = (mode: BrowseMode) => {
    setBrowseMode(mode);
    if (mode === 'team' || mode === 'date') {
      setDefaultBrowseMode(mode);
    }
  };

  const groupedGames = groupGamesByDate(games);

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />

      <div className="max-w-7xl mx-auto px-4 py-8">
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

        <div className="flex justify-center gap-2 sm:gap-4 mb-8">
          <button
            onClick={() => handleModeChange('recent')}
            className={`px-4 sm:px-6 py-3 rounded-lg font-semibold transition text-sm sm:text-base ${
              browseMode === 'recent'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Recent Games
          </button>
          <button
            onClick={() => handleModeChange('team')}
            className={`px-4 sm:px-6 py-3 rounded-lg font-semibold transition text-sm sm:text-base ${
              browseMode === 'team'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Browse by Team
          </button>
          <button
            onClick={() => handleModeChange('date')}
            className={`px-4 sm:px-6 py-3 rounded-lg font-semibold transition text-sm sm:text-base ${
              browseMode === 'date'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Browse by Date
          </button>
        </div>

        {browseMode === 'recent' ? (
          <RecentGamesView
            groupedGames={groupedGames}
            loading={loading}
            error={error}
          />
        ) : browseMode === 'team' ? (
          <TeamGrid onTeamSelect={handleTeamSelect} />
        ) : (
          <DatePicker onDateSelect={handleDateSelect} />
        )}
      </div>
    </div>
  );
}

function RecentGamesView({
  groupedGames,
  loading,
  error,
}: {
  groupedGames: Map<string, Game[]>;
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return <RecentGamesSkeleton />;
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

  if (groupedGames.size === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg">
        <p className="text-gray-600">No recent games found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Array.from(groupedGames.entries()).map(([date, dateGames]) => (
        <div key={date}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {formatDateHeading(date)}
            </h2>
            <Link
              to={`/date/${date}`}
              className="text-sm text-blue-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dateGames.map((game) => (
              <RecentGameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentGameCard({ game }: { game: Game }) {
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
        <Link
          to={`/team/${game.awayTeam.abbreviation.toLowerCase()}`}
          className="font-medium hover:text-blue-600"
        >
          {game.awayTeam.abbreviation}
        </Link>
        {game.status === 'finished' && game.awayScore !== null && (
          <span className="font-bold">{game.awayScore}</span>
        )}
        <span className="text-gray-400 px-2">@</span>
        {game.status === 'finished' && game.homeScore !== null && (
          <span className="font-bold">{game.homeScore}</span>
        )}
        <Link
          to={`/team/${game.homeTeam.abbreviation.toLowerCase()}`}
          className="font-medium hover:text-blue-600"
        >
          {game.homeTeam.abbreviation}
        </Link>
      </div>

      <div className="mt-2 text-xs text-gray-500 text-center">
        {game.status === 'scheduled' && 'Scheduled'}
        {game.status === 'in_progress' && (
          <span className="text-orange-600 font-medium">In Progress</span>
        )}
        {game.status === 'finished' && 'Final'}
      </div>
    </div>
  );
}

function RecentGamesSkeleton() {
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
