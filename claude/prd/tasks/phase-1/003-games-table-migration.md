# Task: Create Games Table Migration

## Task ID
`phase-1/003-games-table-migration`

## Description
Create the database migration for the `games` table that stores NBA game information including teams, scores, and status.

## Prerequisites
- `phase-1/002-teams-table-migration` completed

## Expected Outcomes
1. Games table created with all required columns
2. Foreign key relationships to teams table
3. Appropriate constraints and indexes for query performance
4. Rollback migration functional

## Deliverables

### Migration File
**`migrations/TIMESTAMP_create-games-table.js`**

### Table Schema
```sql
CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(50),                    -- ID from NBA API
  game_date DATE NOT NULL,                    -- Game date (no time)
  game_time TIMESTAMP WITH TIME ZONE,         -- Scheduled start time
  home_team_id INTEGER NOT NULL REFERENCES teams(id),
  away_team_id INTEGER NOT NULL REFERENCES teams(id),
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled',  -- scheduled|in_progress|finished
  home_score INTEGER,                         -- Final or current score
  away_score INTEGER,                         -- Final or current score
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Constraints
```sql
-- Unique constraint for external ID
ALTER TABLE games ADD CONSTRAINT games_external_id_unique UNIQUE (external_id);

-- Check constraint for status values
ALTER TABLE games ADD CONSTRAINT games_status_check
  CHECK (status IN ('scheduled', 'in_progress', 'finished'));

-- Teams must be different
ALTER TABLE games ADD CONSTRAINT games_different_teams_check
  CHECK (home_team_id != away_team_id);
```

### Indexes
```sql
-- Primary query patterns
CREATE INDEX idx_games_date ON games (game_date DESC);
CREATE INDEX idx_games_home_team ON games (home_team_id, game_date DESC);
CREATE INDEX idx_games_away_team ON games (away_team_id, game_date DESC);
CREATE INDEX idx_games_status ON games (status);

-- Composite for video discovery (finished games without videos)
CREATE INDEX idx_games_status_date ON games (status, game_date DESC);

-- External ID lookups (for upserts from API)
CREATE INDEX idx_games_external_id ON games (external_id);
```

### Migration Implementation
```javascript
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

  // Constraints
  pgm.addConstraint('games', 'games_external_id_unique', {
    unique: ['external_id'],
  });
  pgm.addConstraint('games', 'games_status_check', {
    check: "status IN ('scheduled', 'in_progress', 'finished')",
  });
  pgm.addConstraint('games', 'games_different_teams_check', {
    check: 'home_team_id != away_team_id',
  });

  // Indexes
  pgm.createIndex('games', 'game_date', { order: 'DESC' });
  pgm.createIndex('games', ['home_team_id', 'game_date']);
  pgm.createIndex('games', ['away_team_id', 'game_date']);
  pgm.createIndex('games', 'status');
  pgm.createIndex('games', ['status', 'game_date']);
  pgm.createIndex('games', 'external_id');
};

exports.down = (pgm) => {
  pgm.dropTable('games');
};
```

## Acceptance Criteria
- [ ] `npm run migrate` creates games table
- [ ] Foreign keys reference teams table correctly
- [ ] Status constraint prevents invalid values
- [ ] Different teams constraint enforced
- [ ] All indexes created
- [ ] Cascade delete works (deleting team deletes its games)
- [ ] `npm run migrate:down` drops table cleanly

## Technical Notes
- Use `DATE` for game_date (just the date, no time component)
- Use `TIMESTAMP WITH TIME ZONE` for game_time (full datetime)
- Scores are nullable (not available for scheduled games)
- DESC ordering on date indexes for "recent games" queries

## Estimated Complexity
Low-Medium - Table with foreign keys and multiple indexes

## Dependencies
- Task `phase-1/002-teams-table-migration`
