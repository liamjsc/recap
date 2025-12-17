import { db } from '../index';

interface TeamSeed {
  name: string;
  fullName: string;
  abbreviation: string;
  conference: 'Eastern' | 'Western';
  division: string;
  externalId: number;
}

const NBA_TEAMS: TeamSeed[] = [
  // Eastern Conference - Atlantic Division
  { name: 'Celtics', fullName: 'Boston Celtics', abbreviation: 'BOS', conference: 'Eastern', division: 'Atlantic', externalId: 1 },
  { name: 'Nets', fullName: 'Brooklyn Nets', abbreviation: 'BKN', conference: 'Eastern', division: 'Atlantic', externalId: 2 },
  { name: 'Knicks', fullName: 'New York Knicks', abbreviation: 'NYK', conference: 'Eastern', division: 'Atlantic', externalId: 3 },
  { name: '76ers', fullName: 'Philadelphia 76ers', abbreviation: 'PHI', conference: 'Eastern', division: 'Atlantic', externalId: 4 },
  { name: 'Raptors', fullName: 'Toronto Raptors', abbreviation: 'TOR', conference: 'Eastern', division: 'Atlantic', externalId: 5 },

  // Eastern Conference - Central Division
  { name: 'Bulls', fullName: 'Chicago Bulls', abbreviation: 'CHI', conference: 'Eastern', division: 'Central', externalId: 6 },
  { name: 'Cavaliers', fullName: 'Cleveland Cavaliers', abbreviation: 'CLE', conference: 'Eastern', division: 'Central', externalId: 7 },
  { name: 'Pistons', fullName: 'Detroit Pistons', abbreviation: 'DET', conference: 'Eastern', division: 'Central', externalId: 8 },
  { name: 'Pacers', fullName: 'Indiana Pacers', abbreviation: 'IND', conference: 'Eastern', division: 'Central', externalId: 9 },
  { name: 'Bucks', fullName: 'Milwaukee Bucks', abbreviation: 'MIL', conference: 'Eastern', division: 'Central', externalId: 10 },

  // Eastern Conference - Southeast Division
  { name: 'Hawks', fullName: 'Atlanta Hawks', abbreviation: 'ATL', conference: 'Eastern', division: 'Southeast', externalId: 11 },
  { name: 'Hornets', fullName: 'Charlotte Hornets', abbreviation: 'CHA', conference: 'Eastern', division: 'Southeast', externalId: 12 },
  { name: 'Heat', fullName: 'Miami Heat', abbreviation: 'MIA', conference: 'Eastern', division: 'Southeast', externalId: 13 },
  { name: 'Magic', fullName: 'Orlando Magic', abbreviation: 'ORL', conference: 'Eastern', division: 'Southeast', externalId: 14 },
  { name: 'Wizards', fullName: 'Washington Wizards', abbreviation: 'WAS', conference: 'Eastern', division: 'Southeast', externalId: 15 },

  // Western Conference - Northwest Division
  { name: 'Nuggets', fullName: 'Denver Nuggets', abbreviation: 'DEN', conference: 'Western', division: 'Northwest', externalId: 16 },
  { name: 'Timberwolves', fullName: 'Minnesota Timberwolves', abbreviation: 'MIN', conference: 'Western', division: 'Northwest', externalId: 17 },
  { name: 'Thunder', fullName: 'Oklahoma City Thunder', abbreviation: 'OKC', conference: 'Western', division: 'Northwest', externalId: 18 },
  { name: 'Trail Blazers', fullName: 'Portland Trail Blazers', abbreviation: 'POR', conference: 'Western', division: 'Northwest', externalId: 19 },
  { name: 'Jazz', fullName: 'Utah Jazz', abbreviation: 'UTA', conference: 'Western', division: 'Northwest', externalId: 20 },

  // Western Conference - Pacific Division
  { name: 'Warriors', fullName: 'Golden State Warriors', abbreviation: 'GSW', conference: 'Western', division: 'Pacific', externalId: 21 },
  { name: 'Clippers', fullName: 'Los Angeles Clippers', abbreviation: 'LAC', conference: 'Western', division: 'Pacific', externalId: 22 },
  { name: 'Lakers', fullName: 'Los Angeles Lakers', abbreviation: 'LAL', conference: 'Western', division: 'Pacific', externalId: 23 },
  { name: 'Suns', fullName: 'Phoenix Suns', abbreviation: 'PHX', conference: 'Western', division: 'Pacific', externalId: 24 },
  { name: 'Kings', fullName: 'Sacramento Kings', abbreviation: 'SAC', conference: 'Western', division: 'Pacific', externalId: 25 },

  // Western Conference - Southwest Division
  { name: 'Mavericks', fullName: 'Dallas Mavericks', abbreviation: 'DAL', conference: 'Western', division: 'Southwest', externalId: 26 },
  { name: 'Rockets', fullName: 'Houston Rockets', abbreviation: 'HOU', conference: 'Western', division: 'Southwest', externalId: 27 },
  { name: 'Grizzlies', fullName: 'Memphis Grizzlies', abbreviation: 'MEM', conference: 'Western', division: 'Southwest', externalId: 28 },
  { name: 'Pelicans', fullName: 'New Orleans Pelicans', abbreviation: 'NOP', conference: 'Western', division: 'Southwest', externalId: 29 },
  { name: 'Spurs', fullName: 'San Antonio Spurs', abbreviation: 'SAS', conference: 'Western', division: 'Southwest', externalId: 30 },
];

export async function seedTeams(): Promise<void> {
  console.log('Seeding NBA teams...');

  for (const team of NBA_TEAMS) {
    await db.query(
      `INSERT INTO teams (name, full_name, abbreviation, conference, division, external_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (abbreviation) DO UPDATE SET
         name = EXCLUDED.name,
         full_name = EXCLUDED.full_name,
         conference = EXCLUDED.conference,
         division = EXCLUDED.division,
         external_id = EXCLUDED.external_id,
         updated_at = NOW()`,
      [team.name, team.fullName, team.abbreviation, team.conference, team.division, team.externalId]
    );
  }

  console.log(`Seeded ${NBA_TEAMS.length} NBA teams`);
}

export { NBA_TEAMS };
