# Task: Implement Team Page Component

## Task ID
`phase-5/002-team-page-component`

## Description
Create the team detail page that displays a team's recent games with available highlight videos.

## Prerequisites
- `phase-5/001-home-page-component` completed
- `phase-2/002-games-api-endpoints` completed

## Expected Outcomes
1. Team page shows team name and information
2. List of recent games (last 10-15)
3. Each game shows opponent, date, score, and video status
4. Video links open in new tab
5. Proper loading and error states

## Deliverables

### File Structure
```
frontend/src/
├── pages/
│   └── TeamPage.tsx
├── components/
│   ├── GameList.tsx
│   ├── GameCard.tsx
│   └── VideoThumbnail.tsx
├── hooks/
│   └── useTeamGames.ts
```

### Team Page Component
```typescript
// frontend/src/pages/TeamPage.tsx

import { useParams, Link } from 'react-router-dom';
import { useTeamGames } from '../hooks/useTeamGames';
import { GameList } from '../components/GameList';

export function TeamPage() {
  const { abbreviation } = useParams<{ abbreviation: string }>();
  const { team, games, loading, error } = useTeamGames(abbreviation || '');

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
      {/* Team Header */}
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
                {team.conference} Conference • {team.division} Division
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Games List */}
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
```

### useTeamGames Hook
```typescript
// frontend/src/hooks/useTeamGames.ts

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
        // First get team by abbreviation
        const teamData = await apiClient.get<{ team: Team }>(
          `/teams/abbr/${abbreviation.toUpperCase()}`
        );
        setTeam(teamData.team);

        // Then get team's games
        const gamesData = await apiClient.get<{ team: Team; games: Game[] }>(
          `/teams/${teamData.team.id}/games?limit=15`
        );
        setGames(gamesData.games);
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
```

### Game List Component
```typescript
// frontend/src/components/GameList.tsx

import { Game } from '../types';
import { GameCard } from './GameCard';

interface Props {
  games: Game[];
  teamId: number;
}

export function GameList({ games, teamId }: Props) {
  return (
    <div className="space-y-4">
      {games.map((game) => (
        <GameCard
          key={game.id}
          game={game}
          perspectiveTeamId={teamId}
        />
      ))}
    </div>
  );
}
```

### Game Card Component
```typescript
// frontend/src/components/GameCard.tsx

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
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getResultBadge = () => {
    if (game.status !== 'finished' || !game.homeScore || !game.awayScore) {
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
        {/* Video Thumbnail */}
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

        {/* Game Info */}
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

          {/* Score */}
          {game.status === 'finished' && game.homeScore && game.awayScore && (
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

          {/* Watch Button */}
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
```

### Video Thumbnail Component
```typescript
// frontend/src/components/VideoThumbnail.tsx

import { Video } from '../types';

interface Props {
  video: Video;
}

export function VideoThumbnail({ video }: Props) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block relative w-40 h-24 rounded overflow-hidden group"
    >
      <img
        src={video.thumbnailUrl}
        alt={video.title}
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {/* Play overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center">
        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          <PlayIcon className="w-5 h-5 text-white ml-0.5" />
        </div>
      </div>

      {/* Duration badge */}
      <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 rounded">
        {formatDuration(video.durationSeconds)}
      </div>

      {/* Official badge */}
      {video.isVerified && (
        <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1 rounded">
          NBA
        </div>
      )}
    </a>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
```

### Updated Types
```typescript
// frontend/src/types/index.ts (add)

export interface Video {
  id: number;
  youtubeVideoId: string;
  title: string;
  thumbnailUrl: string;
  durationSeconds: number;
  channelName: string;
  isVerified: boolean;
  url: string;
}

export interface TeamBrief {
  id: number;
  name: string;
  abbreviation: string;
  fullName?: string;
}

export interface Game {
  id: number;
  gameDate: string;
  gameTime: string | null;
  status: 'scheduled' | 'in_progress' | 'finished';
  homeTeam: TeamBrief;
  awayTeam: TeamBrief;
  homeScore: number | null;
  awayScore: number | null;
  video: Video | null;
}
```

## Acceptance Criteria
- [ ] Team page loads for valid team abbreviation
- [ ] Team name and conference/division displayed
- [ ] Recent games listed (most recent first)
- [ ] Each game shows opponent, date, and score
- [ ] Win/Loss badge shown for finished games
- [ ] Video thumbnail shown when video available
- [ ] "Highlights coming soon" for games without video
- [ ] "Watch Highlights" button opens YouTube in new tab
- [ ] Duration badge on video thumbnail
- [ ] NBA badge for verified videos
- [ ] Loading skeleton during fetch
- [ ] 404 page for invalid team abbreviation
- [ ] Back link to home page

## Technical Notes
- Use perspective team to show "vs" vs "@"
- Lazy load images for performance
- Video thumbnail hover shows play button
- Consider preloading next/prev team data

## Estimated Complexity
Medium-High - Multiple components with video integration

## Dependencies
- Task `phase-5/001-home-page-component`
- Task `phase-2/002-games-api-endpoints`
