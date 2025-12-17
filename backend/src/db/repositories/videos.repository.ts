import { db } from '../index';

export interface Video {
  id: number;
  gameId: number;
  youtubeVideoId: string;
  title: string;
  channelName: string;
  channelId: string;
  durationSeconds: number;
  thumbnailUrl: string;
  publishedAt: Date;
  viewCount: number | null;
  url: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoWithGame extends Video {
  game: {
    id: number;
    gameDate: Date;
    homeTeamId: number;
    awayTeamId: number;
  };
}

export interface CreateVideoInput {
  gameId: number;
  youtubeVideoId: string;
  title: string;
  channelName: string;
  channelId: string;
  durationSeconds: number;
  thumbnailUrl: string;
  publishedAt: Date;
  viewCount?: number;
  url: string;
  isVerified?: boolean;
}

export interface UpdateVideoInput {
  title?: string;
  channelName?: string;
  durationSeconds?: number;
  thumbnailUrl?: string;
  viewCount?: number;
  isVerified?: boolean;
}

export const videosRepository = {
  /**
   * Find all videos
   */
  async findAll(limit = 100, offset = 0): Promise<Video[]> {
    const result = await db.query<Video>(
      `SELECT id, game_id as "gameId", youtube_video_id as "youtubeVideoId",
              title, channel_name as "channelName", channel_id as "channelId",
              duration_seconds as "durationSeconds", thumbnail_url as "thumbnailUrl",
              published_at as "publishedAt", view_count as "viewCount", url,
              is_verified as "isVerified", created_at as "createdAt", updated_at as "updatedAt"
       FROM videos
       ORDER BY published_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  /**
   * Find video by ID
   */
  async findById(id: number): Promise<Video | null> {
    const result = await db.query<Video>(
      `SELECT id, game_id as "gameId", youtube_video_id as "youtubeVideoId",
              title, channel_name as "channelName", channel_id as "channelId",
              duration_seconds as "durationSeconds", thumbnail_url as "thumbnailUrl",
              published_at as "publishedAt", view_count as "viewCount", url,
              is_verified as "isVerified", created_at as "createdAt", updated_at as "updatedAt"
       FROM videos
       WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Find video by game ID
   */
  async findByGameId(gameId: number): Promise<Video | null> {
    const result = await db.query<Video>(
      `SELECT id, game_id as "gameId", youtube_video_id as "youtubeVideoId",
              title, channel_name as "channelName", channel_id as "channelId",
              duration_seconds as "durationSeconds", thumbnail_url as "thumbnailUrl",
              published_at as "publishedAt", view_count as "viewCount", url,
              is_verified as "isVerified", created_at as "createdAt", updated_at as "updatedAt"
       FROM videos
       WHERE game_id = $1`,
      [gameId]
    );
    return result.rows[0] || null;
  },

  /**
   * Find video by YouTube video ID
   */
  async findByYoutubeVideoId(youtubeVideoId: string): Promise<Video | null> {
    const result = await db.query<Video>(
      `SELECT id, game_id as "gameId", youtube_video_id as "youtubeVideoId",
              title, channel_name as "channelName", channel_id as "channelId",
              duration_seconds as "durationSeconds", thumbnail_url as "thumbnailUrl",
              published_at as "publishedAt", view_count as "viewCount", url,
              is_verified as "isVerified", created_at as "createdAt", updated_at as "updatedAt"
       FROM videos
       WHERE youtube_video_id = $1`,
      [youtubeVideoId]
    );
    return result.rows[0] || null;
  },

  /**
   * Find verified videos
   */
  async findVerified(limit = 100): Promise<Video[]> {
    const result = await db.query<Video>(
      `SELECT id, game_id as "gameId", youtube_video_id as "youtubeVideoId",
              title, channel_name as "channelName", channel_id as "channelId",
              duration_seconds as "durationSeconds", thumbnail_url as "thumbnailUrl",
              published_at as "publishedAt", view_count as "viewCount", url,
              is_verified as "isVerified", created_at as "createdAt", updated_at as "updatedAt"
       FROM videos
       WHERE is_verified = true
       ORDER BY published_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  },

  /**
   * Find videos by channel
   */
  async findByChannelId(channelId: string, limit = 50): Promise<Video[]> {
    const result = await db.query<Video>(
      `SELECT id, game_id as "gameId", youtube_video_id as "youtubeVideoId",
              title, channel_name as "channelName", channel_id as "channelId",
              duration_seconds as "durationSeconds", thumbnail_url as "thumbnailUrl",
              published_at as "publishedAt", view_count as "viewCount", url,
              is_verified as "isVerified", created_at as "createdAt", updated_at as "updatedAt"
       FROM videos
       WHERE channel_id = $1
       ORDER BY published_at DESC
       LIMIT $2`,
      [channelId, limit]
    );
    return result.rows;
  },

  /**
   * Create a new video
   */
  async create(input: CreateVideoInput): Promise<Video> {
    const result = await db.query<Video>(
      `INSERT INTO videos (game_id, youtube_video_id, title, channel_name, channel_id,
                          duration_seconds, thumbnail_url, published_at, view_count, url, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, game_id as "gameId", youtube_video_id as "youtubeVideoId",
                 title, channel_name as "channelName", channel_id as "channelId",
                 duration_seconds as "durationSeconds", thumbnail_url as "thumbnailUrl",
                 published_at as "publishedAt", view_count as "viewCount", url,
                 is_verified as "isVerified", created_at as "createdAt", updated_at as "updatedAt"`,
      [
        input.gameId,
        input.youtubeVideoId,
        input.title,
        input.channelName,
        input.channelId,
        input.durationSeconds,
        input.thumbnailUrl,
        input.publishedAt,
        input.viewCount || null,
        input.url,
        input.isVerified || false,
      ]
    );
    if (!result.rows[0]) {
      throw new Error('Failed to create video');
    }
    return result.rows[0];
  },

  /**
   * Update a video
   */
  async update(id: number, input: UpdateVideoInput): Promise<Video | null> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(input.title);
    }
    if (input.channelName !== undefined) {
      updates.push(`channel_name = $${paramIndex++}`);
      values.push(input.channelName);
    }
    if (input.durationSeconds !== undefined) {
      updates.push(`duration_seconds = $${paramIndex++}`);
      values.push(input.durationSeconds);
    }
    if (input.thumbnailUrl !== undefined) {
      updates.push(`thumbnail_url = $${paramIndex++}`);
      values.push(input.thumbnailUrl);
    }
    if (input.viewCount !== undefined) {
      updates.push(`view_count = $${paramIndex++}`);
      values.push(input.viewCount);
    }
    if (input.isVerified !== undefined) {
      updates.push(`is_verified = $${paramIndex++}`);
      values.push(input.isVerified);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await db.query<Video>(
      `UPDATE videos
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, game_id as "gameId", youtube_video_id as "youtubeVideoId",
                 title, channel_name as "channelName", channel_id as "channelId",
                 duration_seconds as "durationSeconds", thumbnail_url as "thumbnailUrl",
                 published_at as "publishedAt", view_count as "viewCount", url,
                 is_verified as "isVerified", created_at as "createdAt", updated_at as "updatedAt"`,
      values
    );

    return result.rows[0] || null;
  },

  /**
   * Delete a video
   */
  async delete(id: number): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM videos WHERE id = $1',
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  },

  /**
   * Count total videos
   */
  async count(): Promise<number> {
    const result = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM videos'
    );
    if (!result.rows[0]) {
      return 0;
    }
    return parseInt(result.rows[0].count, 10);
  },

  /**
   * Count verified videos
   */
  async countVerified(): Promise<number> {
    const result = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM videos WHERE is_verified = true'
    );
    if (!result.rows[0]) {
      return 0;
    }
    return parseInt(result.rows[0].count, 10);
  },
};
