/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.up = (pgm) => {
  pgm.createTable('job_history', {
    id: 'id',
    job_name: { type: 'varchar(50)', notNull: true },
    status: { type: 'varchar(20)', notNull: true },
    started_at: { type: 'timestamp with time zone', notNull: true },
    completed_at: { type: 'timestamp with time zone', notNull: true },
    duration_ms: { type: 'integer', notNull: true },
    result: { type: 'jsonb' },
    error: { type: 'text' },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('NOW()'),
    },
  });

  // Indexes
  pgm.createIndex('job_history', 'job_name');
  pgm.createIndex('job_history', ['job_name', 'created_at']);
  pgm.createIndex('job_history', 'status');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
exports.down = (pgm) => {
  pgm.dropTable('job_history');
};
