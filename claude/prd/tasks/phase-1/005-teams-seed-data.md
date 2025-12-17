# Task: Create NBA Teams Seed Data

## Task ID
`phase-1/005-teams-seed-data`

## Description
Create a seed script that populates the teams table with all 30 NBA teams including their full metadata (conference, division, abbreviation).

## Prerequisites
- `phase-1/002-teams-table-migration` completed
- Database migrations have been run

## Expected Outcomes
1. Seed script that inserts all 30 NBA teams
2. Script is idempotent (can run multiple times safely)
3. All team metadata accurate and complete

## Deliverables

### File Structure
```
backend/src/db/
├── seeds/
│   └── teams.ts       # Teams seed data and function
└── seed.ts            # Seed runner script
```

### Teams Data
```typescript
// backend/src/db/seeds/teams.ts

export const nbaTeams = [
  // Eastern Conference - Atlantic Division
  { name: 'Celtics', full_name: 'Boston Celtics', abbreviation: 'BOS', conference: 'Eastern', division: 'Atlantic' },
  { name: 'Nets', full_name: 'Brooklyn Nets', abbreviation: 'BKN', conference: 'Eastern', division: 'Atlantic' },
  { name: 'Knicks', full_name: 'New York Knicks', abbreviation: 'NYK', conference: 'Eastern', division: 'Atlantic' },
  { name: '76ers', full_name: 'Philadelphia 76ers', abbreviation: 'PHI', conference: 'Eastern', division: 'Atlantic' },
  { name: 'Raptors', full_name: 'Toronto Raptors', abbreviation: 'TOR', conference: 'Eastern', division: 'Atlantic' },

  // Eastern Conference - Central Division
  { name: 'Bulls', full_name: 'Chicago Bulls', abbreviation: 'CHI', conference: 'Eastern', division: 'Central' },
  { name: 'Cavaliers', full_name: 'Cleveland Cavaliers', abbreviation: 'CLE', conference: 'Eastern', division: 'Central' },
  { name: 'Pistons', full_name: 'Detroit Pistons', abbreviation: 'DET', conference: 'Eastern', division: 'Central' },
  { name: 'Pacers', full_name: 'Indiana Pacers', abbreviation: 'IND', conference: 'Eastern', division: 'Central' },
  { name: 'Bucks', full_name: 'Milwaukee Bucks', abbreviation: 'MIL', conference: 'Eastern', division: 'Central' },

  // Eastern Conference - Southeast Division
  { name: 'Hawks', full_name: 'Atlanta Hawks', abbreviation: 'ATL', conference: 'Eastern', division: 'Southeast' },
  { name: 'Hornets', full_name: 'Charlotte Hornets', abbreviation: 'CHA', conference: 'Eastern', division: 'Southeast' },
  { name: 'Heat', full_name: 'Miami Heat', abbreviation: 'MIA', conference: 'Eastern', division: 'Southeast' },
  { name: 'Magic', full_name: 'Orlando Magic', abbreviation: 'ORL', conference: 'Eastern', division: 'Southeast' },
  { name: 'Wizards', full_name: 'Washington Wizards', abbreviation: 'WAS', conference: 'Eastern', division: 'Southeast' },

  // Western Conference - Northwest Division
  { name: 'Nuggets', full_name: 'Denver Nuggets', abbreviation: 'DEN', conference: 'Western', division: 'Northwest' },
  { name: 'Timberwolves', full_name: 'Minnesota Timberwolves', abbreviation: 'MIN', conference: 'Western', division: 'Northwest' },
  { name: 'Thunder', full_name: 'Oklahoma City Thunder', abbreviation: 'OKC', conference: 'Western', division: 'Northwest' },
  { name: 'Trail Blazers', full_name: 'Portland Trail Blazers', abbreviation: 'POR', conference: 'Western', division: 'Northwest' },
  { name: 'Jazz', full_name: 'Utah Jazz', abbreviation: 'UTA', conference: 'Western', division: 'Northwest' },

  // Western Conference - Pacific Division
  { name: 'Warriors', full_name: 'Golden State Warriors', abbreviation: 'GSW', conference: 'Western', division: 'Pacific' },
  { name: 'Clippers', full_name: 'LA Clippers', abbreviation: 'LAC', conference: 'Western', division: 'Pacific' },
  { name: 'Lakers', full_name: 'Los Angeles Lakers', abbreviation: 'LAL', conference: 'Western', division: 'Pacific' },
  { name: 'Suns', full_name: 'Phoenix Suns', abbreviation: 'PHX', conference: 'Western', division: 'Pacific' },
  { name: 'Kings', full_name: 'Sacramento Kings', abbreviation: 'SAC', conference: 'Western', division: 'Pacific' },

  // Western Conference - Southwest Division
  { name: 'Mavericks', full_name: 'Dallas Mavericks', abbreviation: 'DAL', conference: 'Western', division: 'Southwest' },
  { name: 'Rockets', full_name: 'Houston Rockets', abbreviation: 'HOU', conference: 'Western', division: 'Southwest' },
  { name: 'Grizzlies', full_name: 'Memphis Grizzlies', abbreviation: 'MEM', conference: 'Western', division: 'Southwest' },
  { name: 'Pelicans', full_name: 'New Orleans Pelicans', abbreviation: 'NOP', conference: 'Western', division: 'Southwest' },
  { name: 'Spurs', full_name: 'San Antonio Spurs', abbreviation: 'SAS', conference: 'Western', division: 'Southwest' },
];
```

### Seed Function
```typescript
// backend/src/db/seeds/teams.ts (continued)

import { db } from '../index';
import { nbaTeams } from './teams';

export async function seedTeams(): Promise<void> {
  console.log('Seeding teams...');

  for (const team of nbaTeams) {
    await db.query(
      `INSERT INTO teams (name, full_name, abbreviation, conference, division)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (abbreviation) DO UPDATE SET
         name = EXCLUDED.name,
         full_name = EXCLUDED.full_name,
         conference = EXCLUDED.conference,
         division = EXCLUDED.division,
         updated_at = NOW()`,
      [team.name, team.full_name, team.abbreviation, team.conference, team.division]
    );
  }

  console.log(`✅ Seeded ${nbaTeams.length} teams`);
}
```

### Seed Runner
```typescript
// backend/src/db/seed.ts

import { seedTeams } from './seeds/teams';
import { db } from './index';

async function runSeeds() {
  try {
    console.log('Starting database seeding...\n');

    await seedTeams();

    console.log('\n✅ All seeds completed successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

runSeeds();
```

### NPM Scripts
Add to `backend/package.json`:
```json
{
  "scripts": {
    "db:seed": "ts-node src/db/seed.ts",
    "db:reset": "npm run migrate:down && npm run migrate && npm run db:seed"
  }
}
```

## Acceptance Criteria
- [ ] `npm run db:seed` inserts all 30 NBA teams
- [ ] Running seed twice doesn't create duplicates (upsert)
- [ ] All teams have correct conference and division
- [ ] All abbreviations match official NBA abbreviations
- [ ] Query `SELECT COUNT(*) FROM teams` returns 30
- [ ] Can look up team by abbreviation (e.g., LAL, BOS, GSW)

## Technical Notes
- Use `ON CONFLICT ... DO UPDATE` for idempotent inserts
- Order teams by conference/division for readability
- Abbreviations are official NBA abbreviations
- Some team names differ from city (e.g., "LA Clippers" not "Los Angeles Clippers")

## Estimated Complexity
Low - Data insertion script

## Dependencies
- Task `phase-1/002-teams-table-migration`
