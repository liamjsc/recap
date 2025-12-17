import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTeamGames } from '../hooks/useTeamGames';
import { usePreferences } from '../hooks/usePreferences';
import { GameList } from '../components/GameList';

export function TeamPage() {
  const { abbreviation } = useParams<{ abbreviation: string }>();
  const { team, games, loading, error } = useTeamGames(abbreviation || '');
  const { setLastVisitedTeam } = usePreferences();

  useEffect(() => {
    if (team) {
      setLastVisitedTeam({
        abbreviation: team.abbreviation,
        name: team.name,
      });
    }
  }, [team, setLastVisitedTeam]);

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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {team.fullName}
              </h1>
              <p className="text-gray-600">
                {team.conference} Conference - {team.division} Division
              </p>
            </div>
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
