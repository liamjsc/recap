# Task: Set Up Database Migrations System

## Task ID
`phase-1/001-database-migrations-setup`

## Description
Implement a database migration system that allows versioned, repeatable schema changes with rollback capability.

## Prerequisites
- `phase-0/005-database-connection-setup` completed
- Database accessible

## Expected Outcomes
1. Migration runner configured and functional
2. Migration file structure established
3. CLI commands for running/rolling back migrations
4. Migration history tracked in database

## Deliverables

### Dependencies to Install
```json
{
  "dependencies": {
    "node-pg-migrate": "^6.x"
  }
}
```

### File Structure
```
backend/
├── migrations/
│   └── .gitkeep
├── src/db/
│   └── migrate.ts      # Migration runner script
└── package.json        # Updated with migration scripts
```

### Migration Configuration

**`backend/migrations/.pgmigraterc`** (or in package.json):
```json
{
  "migrationsDir": "migrations",
  "direction": "up",
  "count": "max",
  "verbose": true
}
```

### NPM Scripts

Add to `backend/package.json`:
```json
{
  "scripts": {
    "migrate": "node-pg-migrate up",
    "migrate:down": "node-pg-migrate down",
    "migrate:create": "node-pg-migrate create",
    "migrate:redo": "node-pg-migrate down && node-pg-migrate up"
  }
}
```

### Migration Naming Convention
```
TIMESTAMP_description.js

Examples:
1702500000000_create-teams-table.js
1702500001000_create-games-table.js
1702500002000_create-videos-table.js
```

### Sample Migration Structure
```javascript
// migrations/1702500000000_create-teams-table.js
exports.up = (pgm) => {
  // Schema changes
};

exports.down = (pgm) => {
  // Rollback changes
};
```

### Migration Tracking Table
The `node-pg-migrate` package automatically creates a `pgmigrations` table to track applied migrations:
```sql
CREATE TABLE pgmigrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  run_on TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Acceptance Criteria
- [ ] `npm run migrate:create my_migration` creates new migration file
- [ ] `npm run migrate` runs all pending migrations
- [ ] `npm run migrate:down` rolls back last migration
- [ ] Migration history stored in `pgmigrations` table
- [ ] Same migrations can run on fresh database
- [ ] Migrations work with Neon (production) database

## Technical Notes
- Use `node-pg-migrate` for SQL migrations (simpler than ORMs)
- Each migration must have both `up` and `down` functions
- Test rollbacks before deploying to production
- Run migrations as part of deployment process

## Estimated Complexity
Low - Standard migration tooling setup

## Dependencies
- Task `phase-0/005-database-connection-setup`
