import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTeamGames } from '../hooks/useTeamGames';
import { usePreferences } from '../hooks/usePreferences';
import { GameList } from '../components/GameList';

export function TeamPage() {
  const { abbreviation } = useParams<{ abbreviation: string }>();
  const { team, games, loading, error } = useTeamGames(abbreviation || '');
  const { setLastVisitedTeam, toggleFavoriteTeam, preferences } = usePreferences();

  const isFavorite = team
    ? preferences.favoriteTeams.some((t) => t.abbreviation === team.abbreviation)
    : false;

  useEffect(() => {
    if (team) {
      setLastVisitedTeam({
        abbreviation: team.abbreviation,
        name: team.name,
      });
    }
  }, [team, setLastVisitedTeam]);

  const handleToggleFavorite = () => {
    if (team) {
      toggleFavoriteTeam({ abbreviation: team.abbreviation, name: team.name });
    }
  };

  if (loading) {
    return <TeamPageSkeleton />;
  }

  if (error || !team) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error === 'Team not found' ? 'Team Not Found' : 'Error Loading Team'}
          </h1>
          <p className="text-gray-600 mb-6">
            {error === 'Team not found'
              ? `We couldn't find a team with abbreviation "${abbreviation?.toUpperCase()}"`
              : 'Something went wrong loading this team.'}
          </p>
          <Link
            to="/"
            className="text-blue-600 hover:underline"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            to="/"
            className="text-sm text-blue-600 hover:underline mb-4 inline-block"
          >
            ← Back to Teams
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-gray-600">
                {team.abbreviation}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {team.fullName}
              </h1>
              <p className="text-gray-600">
                {team.conference} Conference - {team.division} Division
              </p>
            </div>
            <button
              onClick={handleToggleFavorite}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                isFavorite
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <StarIcon
                className={`w-5 h-5 ${
                  isFavorite ? 'fill-yellow-400 text-yellow-400' : ''
                }`}
              />
              {isFavorite ? 'Favorited' : 'Favorite'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Recent Games
        </h2>

        {games.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">No recent games found.</p>
          </div>
        ) : (
          <GameList games={games} teamId={team.id} />
        )}
      </div>
    </div>
  );
}

function TeamPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="h-4 w-24 bg-gray-200 rounded mb-4 animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
            <div>
              <div className="h-8 w-48 bg-gray-200 rounded mb-2 animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="h-6 w-32 bg-gray-200 rounded mb-6 animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg mb-4 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  );
}
