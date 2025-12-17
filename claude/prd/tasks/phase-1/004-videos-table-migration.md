# Task: Create Videos Table Migration

## Task ID
`phase-1/004-videos-table-migration`

## Description
Create the database migration for the `videos` table that stores YouTube highlight video information linked to games.

## Prerequisites
- `phase-1/003-games-table-migration` completed

## Expected Outcomes
1. Videos table created with all required columns
2. Foreign key relationship to games table
3. One-to-one relationship enforced (one video per game)
4. Appropriate indexes for query performance

## Deliverables

### Migration File
**`migrations/TIMESTAMP_create-videos-table.js`**

### Table Schema
```sql
CREATE TABLE videos (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  youtube_video_id VARCHAR(20) NOT NULL,      -- YouTube video ID (e.g., "dQw4w9WgXcQ")
  title VARCHAR(255) NOT NULL,                 -- Video title from YouTube
  channel_name VARCHAR(100) NOT NULL,          -- Channel name (e.g., "NBA")
  channel_id VARCHAR(30) NOT NULL,             -- YouTube channel ID
  duration_seconds INTEGER NOT NULL,           -- Duration in seconds
  thumbnail_url VARCHAR(500) NOT NULL,         -- Thumbnail URL
  published_at TIMESTAMP WITH TIME ZONE NOT NULL, -- When video was uploaded
  view_count INTEGER,                          -- View count (optional, can be stale)
  url VARCHAR(100) NOT NULL,                   -- Full YouTube URL
  is_verified BOOLEAN NOT NULL DEFAULT false,  -- From official NBA channel
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Constraints
```sql
-- One video per game (enforced unique)
ALTER TABLE videos ADD CONSTRAINT videos_game_id_unique UNIQUE (game_id);

-- YouTube video ID unique (prevent duplicate videos)
ALTER TABLE videos ADD CONSTRAINT videos_youtube_id_unique UNIQUE (youtube_video_id);

-- Duration must be positive
ALTER TABLE videos ADD CONSTRAINT videos_duration_positive CHECK (duration_seconds > 0);
```

### Indexes
```sql
-- Game lookup (primary query pattern)
CREATE INDEX idx_videos_game_id ON videos (game_id);

-- YouTube video ID lookup (for deduplication)
CREATE INDEX idx_videos_youtube_id ON videos (youtube_video_id);

-- Verified videos filter
CREATE INDEX idx_videos_verified ON videos (is_verified);

-- Recent videos by publish date
CREATE INDEX idx_videos_published ON videos (published_at DESC);
```

### Migration Implementation
```javascript
exports.up = (pgm) => {
  pgm.createTable('videos', {
    id: 'id',
    game_id: {
      type: 'integer',
      notNull: true,
      references: 'games',
      onDelete: 'CASCADE',
    },
    youtube_video_id: { type: 'varchar(20)', notNull: true },
    title: { type: 'varchar(255)', notNull: true },
    channel_name: { type: 'varchar(100)', notNull: true },
    channel_id: { type: 'varchar(30)', notNull: true },
    duration_seconds: { type: 'integer', notNull: true },
    thumbnail_url: { type: 'varchar(500)', notNull: true },
    published_at: { type: 'timestamp with time zone', notNull: true },
    view_count: { type: 'integer' },
    url: { type: 'varchar(100)', notNull: true },
    is_verified: { type: 'boolean', notNull: true, default: false },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Constraints
  pgm.addConstraint('videos', 'videos_game_id_unique', {
    unique: ['game_id'],
  });
  pgm.addConstraint('videos', 'videos_youtube_id_unique', {
    unique: ['youtube_video_id'],
  });
  pgm.addConstraint('videos', 'videos_duration_positive', {
    check: 'duration_seconds > 0',
  });

  // Indexes
  pgm.createIndex('videos', 'game_id');
  pgm.createIndex('videos', 'youtube_video_id');
  pgm.createIndex('videos', 'is_verified');
  pgm.createIndex('videos', 'published_at', { order: 'DESC' });
};

exports.down = (pgm) => {
  pgm.dropTable('videos');
};
```

## Acceptance Criteria
- [ ] `npm run migrate` creates videos table
- [ ] Foreign key references games table correctly
- [ ] Unique constraint prevents multiple videos per game
- [ ] Unique constraint prevents duplicate YouTube videos
- [ ] Duration check constraint enforced
- [ ] Cascade delete works (deleting game deletes its video)
- [ ] All indexes created
- [ ] `npm run migrate:down` drops table cleanly

## Technical Notes
- YouTube video IDs are typically 11 characters, but allow 20 for safety
- Thumbnail URLs can be long (500 chars)
- View count is optional and may be stale (not updated after initial fetch)
- is_verified true when from official NBA channel

## Estimated Complexity
Low-Medium - Table with foreign key and constraints

## Dependencies
- Task `phase-1/003-games-table-migration`
