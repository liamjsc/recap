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

      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition flex items-center justify-center">
        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          <PlayIcon className="w-5 h-5 text-white ml-0.5" />
        </div>
      </div>

      <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 rounded">
        {formatDuration(video.durationSeconds)}
      </div>

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
