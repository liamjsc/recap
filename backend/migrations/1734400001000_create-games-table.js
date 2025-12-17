/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.createTable('games', {
    id: 'id',
    external_id: { type: 'varchar(50)' },
    game_date: { type: 'date', notNull: true },
    game_time: { type: 'timestamp with time zone' },
    home_team_id: {
      type: 'integer',
      notNull: true,
      references: 'teams',
      onDelete: 'CASCADE',
    },
    away_team_id: {
      type: 'integer',
      notNull: true,
      references: 'teams',
      onDelete: 'CASCADE',
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: 'scheduled',
    },
    home_score: { type: 'integer' },
    away_score: { type: 'integer' },
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

  // Unique constraint for external_id
  pgm.addConstraint('games', 'games_external_id_unique', {
    unique: ['external_id'],
  });

  // Check constraints
  pgm.addConstraint('games', 'games_status_check', {
    check: "status IN ('scheduled', 'in_progress', 'finished')",
  });
  pgm.addConstraint('games', 'games_different_teams_check', {
    check: 'home_team_id != away_team_id',
  });

  // Indexes
  pgm.createIndex('games', 'game_date');
  pgm.createIndex('games', 'home_team_id');
  pgm.createIndex('games', 'away_team_id');
  pgm.createIndex('games', 'status');
  pgm.createIndex('games', ['status', 'game_date']);
  pgm.createIndex('games', 'external_id');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable('games');
};
