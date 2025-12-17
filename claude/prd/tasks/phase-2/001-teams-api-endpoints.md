# Task: Implement Teams API Endpoints

## Task ID
`phase-2/001-teams-api-endpoints`

## Description
Implement the REST API endpoints for retrieving NBA team data, including listing all teams and getting individual team details.

## Prerequisites
- `phase-0/003-backend-boilerplate` completed
- `phase-1/006-database-query-helpers` completed

## Expected Outcomes
1. GET `/api/teams` returns all 30 NBA teams
2. GET `/api/teams/:id` returns single team by ID
3. GET `/api/teams/abbr/:abbreviation` returns team by abbreviation
4. Proper error handling for invalid requests

## Deliverables

### API Endpoints

#### GET `/api/teams`
**Description:** List all NBA teams

**Response (200):**
```json
{
  "teams": [
    {
      "id": 1,
      "name": "Hawks",
      "fullName": "Atlanta Hawks",
      "abbreviation": "ATL",
      "conference": "Eastern",
      "division": "Southeast"
    }
    // ... 29 more teams
  ]
}
```

**Query Parameters:**
- `conference` (optional): Filter by "Eastern" or "Western"
- `division` (optional): Filter by division name

#### GET `/api/teams/:id`
**Description:** Get team by numeric ID

**Response (200):**
```json
{
  "team": {
    "id": 23,
    "name": "Lakers",
    "fullName": "Los Angeles Lakers",
    "abbreviation": "LAL",
    "conference": "Western",
    "division": "Pacific"
  }
}
```

**Response (404):**
```json
{
  "error": "Team not found",
  "code": "TEAM_NOT_FOUND"
}
```

#### GET `/api/teams/abbr/:abbreviation`
**Description:** Get team by abbreviation (LAL, BOS, etc.)

**Response:** Same as GET `/api/teams/:id`

### Route Implementation
```typescript
// backend/src/routes/api/teams.ts

import { Router, Request, Response } from 'express';
import { teamQueries } from '../../db/queries';

const router = Router();

// GET /api/teams
router.get('/', async (req: Request, res: Response) => {
  const { conference, division } = req.query;

  let teams = await teamQueries.findAll();

  if (conference) {
    teams = teams.filter(t => t.conference === conference);
  }
  if (division) {
    teams = teams.filter(t => t.division === division);
  }

  res.json({
    teams: teams.map(formatTeam),
  });
});

// GET /api/teams/:id
router.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({
      error: 'Invalid team ID',
      code: 'INVALID_ID',
    });
  }

  const team = await teamQueries.findById(id);

  if (!team) {
    return res.status(404).json({
      error: 'Team not found',
      code: 'TEAM_NOT_FOUND',
    });
  }

  res.json({ team: formatTeam(team) });
});

// GET /api/teams/abbr/:abbreviation
router.get('/abbr/:abbreviation', async (req: Request, res: Response) => {
  const { abbreviation } = req.params;

  const team = await teamQueries.findByAbbreviation(abbreviation);

  if (!team) {
    return res.status(404).json({
      error: 'Team not found',
      code: 'TEAM_NOT_FOUND',
    });
  }

  res.json({ team: formatTeam(team) });
});

// Response formatter (camelCase for JSON)
function formatTeam(team: Team) {
  return {
    id: team.id,
    name: team.name,
    fullName: team.full_name,
    abbreviation: team.abbreviation,
    conference: team.conference,
    division: team.division,
  };
}

export default router;
```

### Response Types
```typescript
// backend/src/types/api.ts

export interface TeamResponse {
  id: number;
  name: string;
  fullName: string;
  abbreviation: string;
  conference: string;
  division: string;
}

export interface TeamsListResponse {
  teams: TeamResponse[];
}

export interface TeamDetailResponse {
  team: TeamResponse;
}

export interface ErrorResponse {
  error: string;
  code: string;
}
```

## Acceptance Criteria
- [ ] GET `/api/teams` returns array of 30 teams
- [ ] GET `/api/teams?conference=Western` returns 15 Western Conference teams
- [ ] GET `/api/teams/1` returns team with ID 1
- [ ] GET `/api/teams/999` returns 404 with error message
- [ ] GET `/api/teams/abbr/LAL` returns Los Angeles Lakers
- [ ] GET `/api/teams/abbr/XXX` returns 404
- [ ] Response uses camelCase property names
- [ ] Invalid ID formats return 400

## Technical Notes
- Use camelCase in JSON responses (JavaScript convention)
- Database uses snake_case (PostgreSQL convention)
- Consider adding response caching headers (teams don't change)
- Place abbreviation route before `:id` route to avoid conflicts

## Estimated Complexity
Low - Standard CRUD endpoints

## Dependencies
- Task `phase-0/003-backend-boilerplate`
- Task `phase-1/006-database-query-helpers`
