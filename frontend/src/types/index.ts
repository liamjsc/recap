export interface Team {
  id: number;
  name: string;
  fullName: string;
  abbreviation: string;
  conference: 'Eastern' | 'Western';
  division: string;
}

export interface TeamBrief {
  id: number;
  name: string;
  abbreviation: string;
  fullName?: string;
}

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
