# Task: Populate Initial Production Data

## Task ID
`phase-6/004-initial-data-population`

## Description
Execute initial data population including schedule sync and video discovery to ensure the application has content on launch.

## Prerequisites
- `phase-6/003-database-production-setup` completed
- `phase-6/002-backend-deployment` completed
- YouTube API key configured

## Expected Outcomes
1. Current season schedule loaded
2. Recent games (last 7-14 days) have videos
3. Data quality verified
4. Application ready for users

## Deliverables

### Data Population Script

```typescript
// backend/scripts/initial-population.ts

import { scheduleService } from '../src/services/schedule';
import { videoMatcherService } from '../src/services/videoMatcher';
import { teamQueries, gameQueries, videoQueries } from '../src/db/queries';
import { pool } from '../src/db/pool';

async function populateInitialData() {
  console.log('🏀 Starting initial data population...\n');

  const startTime = Date.now();

  try {
    // Step 1: Verify teams
    console.log('1️⃣ Verifying teams...');
    const teams = await teamQueries.findAll();
    if (teams.length !== 30) {
      throw new Error(`Expected 30 teams, found ${teams.length}. Run db:seed first.`);
    }
    console.log(`   ✅ ${teams.length} teams verified\n`);

    // Step 2: Sync schedule (current season)
    console.log('2️⃣ Syncing NBA schedule...');
    const scheduleResult = await syncCurrentSeason();
    console.log(`   ✅ Schedule synced: ${scheduleResult.gamesAdded} added, ${scheduleResult.gamesUpdated} updated\n`);

    // Step 3: Discover videos for recent games
    console.log('3️⃣ Discovering videos for recent games...');
    const videoResult = await discoverRecentVideos();
    console.log(`   ✅ Videos discovered: ${videoResult.videosFound} found, ${videoResult.videosFailed} not found\n`);

    // Step 4: Summary
    console.log('4️⃣ Final statistics...');
    const stats = await getDataStats();
    console.log(`   Total games: ${stats.totalGames}`);
    console.log(`   Finished games: ${stats.finishedGames}`);
    console.log(`   Games with videos: ${stats.gamesWithVideos}`);
    console.log(`   Video coverage: ${stats.videoCoverage}%\n`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Initial population complete in ${duration}s`);

  } catch (error) {
    console.error('❌ Population failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function syncCurrentSeason() {
  // Get current season dates
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // NBA season runs October - April
  // If before October, use previous season
  const seasonStartYear = month >= 9 ? year : year - 1;

  const startDate = `${seasonStartYear}-10-01`;
  const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  console.log(`   Syncing from ${startDate} to ${endDate}...`);

  return scheduleService.syncSchedule({
    startDate,
    endDate,
  });
}

async function discoverRecentVideos() {
  // Focus on last 14 days of finished games
  const result = await videoMatcherService.discoverVideos({
    limit: 100,  // Process up to 100 games
    minHoursAfterGame: 3,
  });

  return result;
}

async function getDataStats() {
  const totalGamesResult = await pool.query('SELECT COUNT(*) as count FROM games');
  const finishedGamesResult = await pool.query(
    "SELECT COUNT(*) as count FROM games WHERE status = 'finished'"
  );
  const gamesWithVideosResult = await pool.query(`
    SELECT COUNT(DISTINCT g.id) as count
    FROM games g
    JOIN videos v ON g.id = v.game_id
  `);

  const totalGames = parseInt(totalGamesResult.rows[0].count, 10);
  const finishedGames = parseInt(finishedGamesResult.rows[0].count, 10);
  const gamesWithVideos = parseInt(gamesWithVideosResult.rows[0].count, 10);

  return {
    totalGames,
    finishedGames,
    gamesWithVideos,
    videoCoverage: finishedGames > 0
      ? ((gamesWithVideos / finishedGames) * 100).toFixed(1)
      : '0',
  };
}

populateInitialData();
```

### NPM Script

Add to `backend/package.json`:
```json
{
  "scripts": {
    "populate": "ts-node scripts/initial-population.ts"
  }
}
```

### Manual Population Steps

If script doesn't work or for manual control:

```bash
# 1. Sync schedule via admin API
curl -X POST https://your-backend.vercel.app/api/admin/fetch-schedule \
  -H "X-Admin-API-Key: your-admin-key" \
  -H "Content-Type: application/json"

# 2. Discover videos (run multiple times, respects quota)
curl -X POST https://your-backend.vercel.app/api/admin/fetch-videos \
  -H "X-Admin-API-Key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"limit": 20}'

# 3. Check job status
curl https://your-backend.vercel.app/api/jobs/status

# 4. Verify data
curl https://your-backend.vercel.app/health
```

### Data Verification Queries

Run these to verify data quality:

```sql
-- Total games by status
SELECT status, COUNT(*) as count
FROM games
GROUP BY status;

-- Games per day (recent)
SELECT game_date, COUNT(*) as games
FROM games
WHERE game_date >= CURRENT_DATE - INTERVAL '14 days'
GROUP BY game_date
ORDER BY game_date DESC;

-- Video coverage by date
SELECT
  g.game_date,
  COUNT(*) as total_games,
  COUNT(v.id) as with_videos,
  ROUND(COUNT(v.id)::numeric / COUNT(*)::numeric * 100, 1) as coverage_pct
FROM games g
LEFT JOIN videos v ON g.id = v.game_id
WHERE g.game_date >= CURRENT_DATE - INTERVAL '14 days'
GROUP BY g.game_date
ORDER BY g.game_date DESC;

-- Videos by channel (verify official NBA)
SELECT
  channel_name,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM videos)::numeric * 100, 1) as pct
FROM videos
GROUP BY channel_name;

-- Sample recent games with videos
SELECT
  g.game_date,
  ht.abbreviation as home,
  at.abbreviation as away,
  g.home_score,
  g.away_score,
  v.title,
  v.duration_seconds
FROM games g
JOIN teams ht ON g.home_team_id = ht.id
JOIN teams at ON g.away_team_id = at.id
LEFT JOIN videos v ON g.id = v.game_id
WHERE g.status = 'finished'
ORDER BY g.game_date DESC
LIMIT 10;
```

### Expected Data After Population

| Metric | Expected Value |
|--------|----------------|
| Teams | 30 |
| Games (current season) | 200-1200 (depends on date) |
| Finished games | Varies |
| Video coverage | >80% for recent games |
| Videos from NBA channel | >95% |

### Troubleshooting

**No games loading:**
- Check NBA API is accessible
- Verify date range is correct
- Check team mapping is working

**Videos not being found:**
- Check YouTube API key is valid
- Verify quota not exceeded
- Check search query format matches NBA titles
- Try manual search on YouTube to verify videos exist

**Low video coverage:**
- Some games may not have highlights yet
- Re-run video discovery after 24 hours
- Check for API errors in logs

## Acceptance Criteria
- [ ] Schedule sync completes without errors
- [ ] At least 50 recent games imported
- [ ] Video discovery finds videos for >80% of finished games
- [ ] Data verification queries return expected results
- [ ] Frontend displays games correctly
- [ ] Video links work (open YouTube)

## Technical Notes
- Run population after backend is deployed
- YouTube quota limits how many videos can be found per day
- May need multiple runs over several days for full coverage
- Monitor quota usage via admin endpoint

## Estimated Complexity
Medium - Data population with API calls

## Dependencies
- Task `phase-6/003-database-production-setup`
- Task `phase-6/002-backend-deployment`
