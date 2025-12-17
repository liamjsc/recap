import { Game } from '../types';
import { VideoThumbnail } from './VideoThumbnail';

interface Props {
  game: Game;
  perspectiveTeamId: number;
}

export function GameCard({ game, perspectiveTeamId }: Props) {
  const isHome = game.homeTeam.id === perspectiveTeamId;
  const opponent = isHome ? game.awayTeam : game.homeTeam;
  const locationPrefix = isHome ? 'vs' : '@';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getResultBadge = () => {
    if (game.status !== 'finished' || game.homeScore === null || game.awayScore === null) {
      return null;
    }

    const perspectiveScore = isHome ? game.homeScore : game.awayScore;
    const opponentScore = isHome ? game.awayScore : game.homeScore;
    const won = perspectiveScore > opponentScore;

    return (
      <span
        className={`px-2 py-1 rounded text-xs font-semibold ${
          won ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}
      >
        {won ? 'W' : 'L'}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          {game.video ? (
            <VideoThumbnail video={game.video} />
          ) : (
            <div className="w-40 h-24 bg-gray-100 rounded flex items-center justify-center">
              <span className="text-xs text-gray-500 text-center px-2">
                {game.status === 'finished'
                  ? 'Highlights coming soon'
                  : 'Game not started'}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-gray-500">
                  {formatDate(game.gameDate)}
                </span>
                {getResultBadge()}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {locationPrefix} {opponent.fullName || opponent.name}
              </h3>
            </div>
          </div>

          {game.status === 'finished' && game.homeScore !== null && game.awayScore !== null && (
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {isHome
                ? `${game.homeScore} - ${game.awayScore}`
                : `${game.awayScore} - ${game.homeScore}`}
            </div>
          )}

          {game.status === 'scheduled' && (
            <p className="mt-2 text-sm text-gray-500">
              Scheduled
            </p>
          )}

          {game.status === 'in_progress' && (
            <p className="mt-2 text-sm text-orange-600 font-medium">
              In Progress
            </p>
          )}

          {game.video && (
            <a
              href={game.video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
            >
              <PlayIcon className="w-4 h-4" />
              Watch Highlights
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
