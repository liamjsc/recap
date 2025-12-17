/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
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

  // Unique constraints
  pgm.addConstraint('videos', 'videos_game_id_unique', {
    unique: ['game_id'],
  });
  pgm.addConstraint('videos', 'videos_youtube_id_unique', {
    unique: ['youtube_video_id'],
  });

  // Check constraint
  pgm.addConstraint('videos', 'videos_duration_positive', {
    check: 'duration_seconds > 0',
  });

  // Indexes
  pgm.createIndex('videos', 'game_id');
  pgm.createIndex('videos', 'youtube_video_id');
  pgm.createIndex('videos', 'is_verified');
  pgm.createIndex('videos', 'published_at');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable('videos');
};
