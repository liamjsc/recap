import { Team } from '../types';

interface Props {
  team: Team;
  onClick: () => void;
}

export function TeamCard({ team, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer border border-gray-100 hover:border-blue-300"
    >
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
        <span className="text-sm font-bold text-gray-600">
          {team.abbreviation}
        </span>
      </div>
      <span className="text-sm font-medium text-gray-900 text-center">
        {team.name}
      </span>
    </button>
  );
}
