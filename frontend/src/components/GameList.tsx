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
