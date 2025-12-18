import { Team } from '../types';

interface Props {
  team: Team;
  onClick: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}

export function TeamCard({ team, onClick, isFavorite, onToggleFavorite }: Props) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer border border-gray-100 hover:border-blue-300"
    >
      {onToggleFavorite && (
        <button
          onClick={onToggleFavorite}
          className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full transition"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <StarIcon
            className={`w-4 h-4 ${
              isFavorite
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 hover:text-yellow-400'
            }`}
          />
        </button>
      )}
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
