import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDateGames } from '../hooks/useDateGames';
import { VideoThumbnail } from '../components/VideoThumbnail';
import { Game } from '../types';

export function DatePage() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { games, loading, error, dateInfo } = useDateGames(date || '');

  const handlePrevDay = () => {
    if (dateInfo?.prevDate) {
      navigate(`/date/${dateInfo.prevDate}`);
    }
  };

  const handleNextDay = () => {
    if (dateInfo?.nextDate) {
      navigate(`/date/${dateInfo.nextDate}`);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    navigate(`/date/${e.target.value}`);
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error Loading Games
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/" className="text-blue-600 hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            to="/"
            className="text-sm text-blue-600 hover:underline mb-2 inline-block"
          >
            ← Back to Home
          </Link>

          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevDay}
              disabled={!dateInfo?.prevDate}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous day"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>

            <div className="text-center">
              {loading ? (
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mx-auto" />
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {dateInfo?.displayDate}
                  </h1>
                  {dateInfo?.isToday && (
                    <span className="text-sm text-blue-600">Today</span>
                  )}
                </>
              )}
            </div>

            <button
              onClick={handleNextDay}
              disabled={!dateInfo?.nextDate}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next day"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="mt-3 flex justify-center">
            <input
              type="date"
              value={date}
              onChange={handleDateChange}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <DatePageSkeleton />
        ) : games.length === 0 ? (
          <EmptyState date={dateInfo?.displayDate || date || ''} />
        ) : (
          <div className="space-y-6">
            <div className="text-sm text-gray-600">
              {games.length} game{games.length !== 1 ? 's' : ''}
            </div>
            <div className="space-y-4">
              {games.map((game) => (
                <DateGameCard key={game.id} game={game} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DateGameCard({ game }: { game: Game }) {
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    const time = new Date(timeStr);
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
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
          <div className="flex items-center gap-4 mb-2">
            <div className="flex-1">
              <Link
                to={`/team/${game.awayTeam.abbreviation.toLowerCase()}`}
                className="font-semibold text-gray-900 hover:text-blue-600"
              >
                {game.awayTeam.name}
              </Link>
              {game.status === 'finished' && game.awayScore !== null && (
                <span className="ml-2 text-xl font-bold">{game.awayScore}</span>
              )}
            </div>
            <span className="text-gray-400">@</span>
            <div className="flex-1 text-right">
              <Link
                to={`/team/${game.homeTeam.abbreviation.toLowerCase()}`}
                className="font-semibold text-gray-900 hover:text-blue-600"
              >
                {game.homeTeam.name}
              </Link>
              {game.status === 'finished' && game.homeScore !== null && (
                <span className="ml-2 text-xl font-bold">{game.homeScore}</span>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-500">
            {game.status === 'scheduled' && game.gameTime && (
              <span>{formatTime(game.gameTime)}</span>
            )}
            {game.status === 'in_progress' && (
              <span className="text-orange-600 font-medium">In Progress</span>
            )}
            {game.status === 'finished' && (
              <span>Final</span>
            )}
          </div>

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

function EmptyState({ date }: { date: string }) {
  return (
    <div className="text-center py-16 bg-white rounded-lg">
      <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        No Games Scheduled
      </h2>
      <p className="text-gray-600">
        There are no NBA games on {date}.
      </p>
    </div>
  );
}

function DatePageSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
