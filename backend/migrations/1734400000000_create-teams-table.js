/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.createTable('teams', {
    id: 'id',
    name: { type: 'varchar(50)', notNull: true },
    full_name: { type: 'varchar(100)', notNull: true },
    abbreviation: { type: 'varchar(3)', notNull: true },
    conference: { type: 'varchar(10)', notNull: true },
    division: { type: 'varchar(20)', notNull: true },
    external_id: { type: 'integer' },
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
  pgm.addConstraint('teams', 'teams_abbreviation_unique', {
    unique: ['abbreviation'],
  });
  pgm.addConstraint('teams', 'teams_full_name_unique', {
    unique: ['full_name'],
  });

  // Check constraint for conference
  pgm.addConstraint('teams', 'teams_conference_check', {
    check: "conference IN ('Western', 'Eastern')",
  });

  // Indexes
  pgm.createIndex('teams', 'abbreviation');
  pgm.createIndex('teams', 'conference');
  pgm.createIndex('teams', 'division');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable('teams');
};
