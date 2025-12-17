# Task: Production Validation & Launch

## Task ID
`phase-6/005-production-validation`

## Description
Comprehensive validation of the deployed application to ensure all features work correctly in production before public launch.

## Prerequisites
- `phase-6/001-vercel-frontend-deployment` completed
- `phase-6/002-backend-deployment` completed
- `phase-6/004-initial-data-population` completed

## Expected Outcomes
1. All user flows verified working
2. Performance acceptable
3. Error handling verified
4. Mobile experience tested
5. Application ready for public use

## Deliverables

### Validation Checklist

#### Infrastructure Checks

| Check | How to Verify | Expected Result |
|-------|--------------|-----------------|
| Frontend accessible | Visit production URL | Home page loads |
| Backend health | GET /health | Returns 200, DB connected |
| HTTPS enabled | Check URL bar | Lock icon, https:// |
| CORS working | Check browser console | No CORS errors |
| Environment correct | Check /health response | NODE_ENV: production |

#### API Endpoint Checks

```bash
# Base URL (replace with your backend URL)
BASE_URL="https://your-backend.vercel.app"

# Health check
curl -s "$BASE_URL/health" | jq

# Teams list
curl -s "$BASE_URL/api/teams" | jq '.teams | length'
# Expected: 30

# Single team
curl -s "$BASE_URL/api/teams/abbr/LAL" | jq
# Expected: Lakers team object

# Team games
curl -s "$BASE_URL/api/teams/1/games?limit=5" | jq
# Expected: Array of games

# Games by date (use recent date)
curl -s "$BASE_URL/api/games/date/2024-12-14" | jq
# Expected: Array of games

# Job status
curl -s "$BASE_URL/api/jobs/status" | jq
# Expected: Job history with quota info

# Admin endpoint (should require auth)
curl -s "$BASE_URL/api/admin/fetch-schedule"
# Expected: 401 Unauthorized
```

#### Frontend User Flow Tests

**Flow 1: Browse by Team**
1. [ ] Load home page
2. [ ] See "Browse by Team" selected by default
3. [ ] See all 30 teams displayed
4. [ ] Click conference filter, teams filter correctly
5. [ ] Click on Lakers (LAL)
6. [ ] Team page loads with "Los Angeles Lakers"
7. [ ] Recent games displayed
8. [ ] Games show opponent, date, score
9. [ ] At least one game has video thumbnail
10. [ ] Click "Watch Highlights" → YouTube opens

**Flow 2: Browse by Date**
1. [ ] Return to home page
2. [ ] Click "Browse by Date"
3. [ ] Date picker displays today
4. [ ] Select a recent game day
5. [ ] Click "View Games"
6. [ ] Date page shows all games from that day
7. [ ] Games show both teams
8. [ ] Previous/Next navigation works
9. [ ] Team names link to team pages

**Flow 3: Navigation**
1. [ ] Header visible on all pages
2. [ ] Logo links to home
3. [ ] "Today's Games" link works
4. [ ] Back links work correctly
5. [ ] 404 page for invalid routes (/invalid-page)
6. [ ] Browser back/forward work

**Flow 4: Mobile Experience**
1. [ ] Home page responsive on mobile
2. [ ] Mobile menu opens/closes
3. [ ] Team grid usable on small screens
4. [ ] Game cards readable on mobile
5. [ ] Video thumbnails tap-able
6. [ ] Date navigation works on touch

#### Error Handling Tests

| Scenario | How to Test | Expected Behavior |
|----------|------------|-------------------|
| Invalid team | Visit /team/xyz | "Team not found" message |
| Invalid date | Visit /date/invalid | Error message displayed |
| Network error | Disable network, reload | Error state with retry option |
| Missing video | Find game without video | "Highlights coming soon" message |

#### Performance Tests

```bash
# Measure API response times
time curl -s "$BASE_URL/health" > /dev/null
# Expected: < 500ms

time curl -s "$BASE_URL/api/teams" > /dev/null
# Expected: < 300ms

time curl -s "$BASE_URL/api/teams/1/games" > /dev/null
# Expected: < 500ms
```

**Lighthouse Audit:**
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Run audit for Mobile
4. Target scores:
   - Performance: > 80
   - Accessibility: > 90
   - Best Practices: > 90
   - SEO: > 80

### Manual Testing Script

```markdown
## Production Validation - [DATE]

### Tester: _______________
### Production URL: _______________

#### Infrastructure
- [ ] Frontend loads (Time: ___ms)
- [ ] Health check passes
- [ ] No console errors
- [ ] HTTPS certificate valid

#### Teams (30 total)
- [ ] Lakers (LAL) page works
- [ ] Warriors (GSW) page works
- [ ] Celtics (BOS) page works
- [ ] Random team: ___ works

#### Games
- [ ] Today's date shows games
- [ ] Yesterday shows games
- [ ] Games have correct teams
- [ ] Scores display for finished games

#### Videos
- [ ] Thumbnails load correctly
- [ ] Duration shows on thumbnails
- [ ] NBA badge shows for official videos
- [ ] YouTube link opens correctly
- [ ] Video title matches game

#### Mobile (test on phone or emulator)
- [ ] Home page usable
- [ ] Menu works
- [ ] Team page scrollable
- [ ] Video tappable

#### Notes/Issues:
_______________________________________________
_______________________________________________
```

### Smoke Test Automation (Optional)

```typescript
// tests/smoke.test.ts

import fetch from 'node-fetch';

const BASE_URL = process.env.PRODUCTION_URL || 'https://your-app.vercel.app';
const API_URL = process.env.PRODUCTION_API_URL || 'https://your-backend.vercel.app';

describe('Production Smoke Tests', () => {
  test('Frontend loads', async () => {
    const response = await fetch(BASE_URL);
    expect(response.ok).toBe(true);
    expect(response.headers.get('content-type')).toContain('text/html');
  });

  test('API health check', async () => {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.services.database).toBe('connected');
  });

  test('Teams API returns 30 teams', async () => {
    const response = await fetch(`${API_URL}/api/teams`);
    const data = await response.json();
    expect(data.teams).toHaveLength(30);
  });

  test('Team page returns games', async () => {
    const response = await fetch(`${API_URL}/api/teams/1/games`);
    const data = await response.json();
    expect(data.games).toBeDefined();
    expect(Array.isArray(data.games)).toBe(true);
  });

  test('Date API returns games', async () => {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(`${API_URL}/api/games/date/${today}`);
    const data = await response.json();
    expect(data.date).toBe(today);
    expect(data.games).toBeDefined();
  });
});
```

### Launch Announcement Template

```markdown
# NBA Highlights Aggregator - Now Live!

🏀 Find and watch full game highlights for every NBA game.

**Features:**
- Browse by team or date
- Instant access to YouTube highlights
- Official NBA channel videos
- Mobile-friendly design

**Try it now:** [Your URL]

---

This is a fan project and is not affiliated with the NBA.
Videos provided by NBA on YouTube.
```

## Acceptance Criteria
- [ ] All infrastructure checks pass
- [ ] All API endpoints respond correctly
- [ ] All user flows complete successfully
- [ ] Mobile experience verified
- [ ] Error handling works as expected
- [ ] Performance meets targets
- [ ] No critical bugs found
- [ ] Ready for public announcement

## Technical Notes
- Run full validation after any deployment
- Keep checklist for regression testing
- Document any issues found
- Have rollback plan ready

## Estimated Complexity
Low-Medium - Manual testing and verification

## Dependencies
- All Phase 6 tasks completed
