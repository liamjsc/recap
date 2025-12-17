// API Response types

export interface TeamResponse {
  id: number;
  name: string;
  fullName: string;
  abbreviation: string;
  conference: string;
  division: string;
}

export interface TeamBriefResponse {
  id: number;
  name: string;
  abbreviation: string;
}

export interface VideoResponse {
  id: number;
  youtubeVideoId: string;
  title: string;
  thumbnailUrl: string;
  durationSeconds: number;
  channelName: string;
  isVerified: boolean;
  url: string;
}

export interface GameResponse {
  id: number;
  gameDate: string;
  gameTime: string | null;
  status: 'scheduled' | 'in_progress' | 'finished';
  homeTeam: TeamBriefResponse;
  awayTeam: TeamBriefResponse;
  homeScore: number | null;
  awayScore: number | null;
  video: VideoResponse | null;
}

export interface ErrorResponse {
  error: string;
  code: string;
  requestId?: string;
  details?: Record<string, string>;
}
