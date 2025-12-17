# Task: Create Teams Table Migration

## Task ID
`phase-1/002-teams-table-migration`

## Description
Create the database migration for the `teams` table that stores all 30 NBA teams with their metadata.

## Prerequisites
- `phase-1/001-database-migrations-setup` completed

## Expected Outcomes
1. Teams table created with all required columns
2. Appropriate constraints and indexes in place
3. Rollback migration functional

## Deliverables

### Migration File
**`migrations/TIMESTAMP_create-teams-table.js`**

### Table Schema
```sql
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,           -- "Lakers"
  full_name VARCHAR(100) NOT NULL,     -- "Los Angeles Lakers"
  abbreviation VARCHAR(3) NOT NULL,    -- "LAL"
  conference VARCHAR(10) NOT NULL,     -- "Western" | "Eastern"
  division VARCHAR(20) NOT NULL,       -- "Pacific", "Atlantic", etc.
  external_id INTEGER,                 -- ID from NBA API (nullable for flexibility)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Constraints
```sql
-- Unique constraints
ALTER TABLE teams ADD CONSTRAINT teams_abbreviation_unique UNIQUE (abbreviation);
ALTER TABLE teams ADD CONSTRAINT teams_full_name_unique UNIQUE (full_name);

-- Check constraints
ALTER TABLE teams ADD CONSTRAINT teams_conference_check
  CHECK (conference IN ('Western', 'Eastern'));
```

### Indexes
```sql
-- For lookups by abbreviation (used in URLs)
CREATE INDEX idx_teams_abbreviation ON teams (abbreviation);

-- For filtering by conference/division
CREATE INDEX idx_teams_conference ON teams (conference);
CREATE INDEX idx_teams_division ON teams (division);
```

### Migration Implementation
```javascript
exports.up = (pgm) => {
  pgm.createTable('teams', {
    id: 'id',  // shorthand for SERIAL PRIMARY KEY
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

  pgm.addConstraint('teams', 'teams_abbreviation_unique', {
    unique: ['abbreviation'],
  });
  pgm.addConstraint('teams', 'teams_full_name_unique', {
    unique: ['full_name'],
  });
  pgm.addConstraint('teams', 'teams_conference_check', {
    check: "conference IN ('Western', 'Eastern')",
  });

  pgm.createIndex('teams', 'abbreviation');
  pgm.createIndex('teams', 'conference');
  pgm.createIndex('teams', 'division');
};

exports.down = (pgm) => {
  pgm.dropTable('teams');
};
```

## Acceptance Criteria
- [ ] `npm run migrate` creates teams table
- [ ] All columns exist with correct types
- [ ] Unique constraints prevent duplicate abbreviations/names
- [ ] Conference check constraint enforced
- [ ] `npm run migrate:down` drops table cleanly
- [ ] Migration is idempotent (can run on fresh DB)

## Technical Notes
- Use `TIMESTAMP WITH TIME ZONE` for proper timezone handling
- Keep abbreviations uppercase for consistency
- external_id nullable to allow manual team additions

## Estimated Complexity
Low - Single table creation

## Dependencies
- Task `phase-1/001-database-migrations-setup`
