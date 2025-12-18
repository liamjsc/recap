import { Game } from '../types';
import { GameCard } from './GameCard';

interface Props {
  games: Game[];
  teamId: number;
}

export function GameList({ games, teamId }: Props) {
  // Only show finished games on team pages
  const finishedGames = games.filter((game) => game.status === 'finished');

  if (finishedGames.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg">
        <p className="text-gray-600">No finished games yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {finishedGames.map((game) => (
        <GameCard
          key={game.id}
          game={game}
          perspectiveTeamId={teamId}
        />
      ))}
    </div>
  );
}
