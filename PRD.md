# NBA Highlights Aggregator - Product Requirements Document

## 1. Overview

### 1.1 Product Vision
A streamlined web application that aggregates NBA game highlight videos from YouTube, making it effortless for fans to find and watch highlights for any team or recent game.

### 1.2 Core Value Proposition
- **One-stop shop**: No more searching through YouTube for each team's highlights
- **Consistent experience**: Reliable sources, standardized ~15min full game highlights
- **Fast access**: Pick a team → see recent games → watch immediately
- **Time-aware**: Leverages NBA schedule to know when to look for new content

### 1.3 Target Users
- NBA fans who want to catch up on games they missed
- Fans of specific teams looking for recent highlights
- Basketball enthusiasts browsing recent games across the league

---

## 2. Technical Architecture

### 2.1 Tech Stack

**Frontend:**
- React (Create React App or Vite)
- Modern CSS (CSS Modules, Tailwind, or styled-components)
- React Router for navigation
- Local Storage for user preferences

**Backend:**
- Node.js with Express
- RESTful API architecture
- Scheduled jobs (node-cron or similar) for automated video fetching

**Database:**
- PostgreSQL (recommended) or SQLite for simpler local development
- Stores: games, videos, teams, schedule data

**External APIs:**
- YouTube Data API v3 (for video search/metadata)
- NBA Schedule API (e.g., balldontlie.io, ESPN API, or nba.com endpoints)

**Deployment:**
- Frontend: Vercel, Netlify, or similar
- Backend: Railway, Render, Heroku, or Vercel serverless functions
- Database: Managed PostgreSQL (Railway, Render, Supabase) or SQLite file

### 2.2 System Architecture

```
┌─────────────────┐
│   React Client  │
│  (User Browser) │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────────────┐
│   Express API Server    │
│  ┌──────────────────┐   │
│  │  Routes/Controllers  │
│  │  - /api/games    │   │
│  │  - /api/teams    │   │
│  │  - /api/videos   │   │
│  └──────────────────┘   │
│  ┌──────────────────┐   │
│  │  Services        │   │
│  │  - YouTubeService│   │
│  │  - ScheduleService│  │
│  │  - VideoMatcher  │   │
│  └──────────────────┘   │
│  ┌──────────────────┐   │
│  │  Scheduled Jobs  │   │
│  │  - Fetch schedule│   │
│  │  - Search videos │   │
│  └──────────────────┘   │
└────────┬────────────────┘
         │
         │
┌────────▼────────┐
│   PostgreSQL    │
│    Database     │
└─────────────────┘

External APIs:
  ├─ YouTube Data API v3
  └─ NBA Schedule API
```

---

## 3. Data Models

### 3.1 Teams
```typescript
{
  id: number (primary key)
  name: string              // "Lakers"
  fullName: string          // "Los Angeles Lakers"
  abbreviation: string      // "LAL"
  conference: string        // "Western"
  division: string          // "Pacific"
  externalId: number        // API reference ID
}
```

### 3.2 Games
```typescript
{
  id: number (primary key)
  externalId: string        // From NBA API
  gameDate: date            // Game date
  gameTime: timestamp       // Scheduled start time
  gameEndTime: timestamp?   // Estimated/actual end time (optional)
  homeTeamId: number        // Foreign key to Teams
  awayTeamId: number        // Foreign key to Teams
  status: string            // "scheduled" | "in_progress" | "finished"
  homeScore: number?
  awayScore: number?
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 3.3 Videos
```typescript
{
  id: number (primary key)
  gameId: number            // Foreign key to Games
  youtubeVideoId: string    // e.g., "dQw4w9WgXcQ"
  title: string             // "LAKERS at SUNS | FULL GAME HIGHLIGHTS..."
  channelName: string       // "NBA"
  channelId: string         // YouTube channel ID
  duration: number          // Duration in seconds
  thumbnailUrl: string
  publishedAt: timestamp    // When video was uploaded
  viewCount: number?
  url: string               // Full YouTube URL
  isVerified: boolean       // From trusted source (NBA channel)
  createdAt: timestamp      // When we discovered it
  updatedAt: timestamp
}
```

### 3.4 User Preferences (LocalStorage)
```typescript
{
  theme: "light" | "dark"
  defaultView: "date" | "team"
  lastVisitedTeam: number?
  // Future: favoriteTeams: number[]
}
```

---

## 4. Features & Requirements

### 4.1 Must-Have Features (v1)

#### 4.1.1 Team Browser
- **UI Component**: Team selector (dropdown, grid, or list)
- **Functionality**:
  - Display all 30 NBA teams
  - Click team → navigate to team page
  - Show team logo/colors (optional enhancement)
- **Data**: Load teams from database (seeded on initialization)

#### 4.1.2 Team Page
- **Route**: `/team/:teamId` or `/team/:abbreviation`
- **Display**:
  - Team name and basic info
  - List of recent games (last 10-15 games)
  - Each game shows:
    - Date
    - Opponent
    - Score (if available)
    - Highlight video (embedded or link)
    - Video metadata (duration, upload time, channel)
- **Empty State**: "No highlights found yet" if videos aren't available

#### 4.1.3 Date Browser
- **UI Component**: Calendar picker or date navigation (prev/next day buttons)
- **Functionality**:
  - Select any date
  - View all games that occurred on that date
  - Show available highlight videos for each game
- **Route**: `/date/:YYYY-MM-DD`
- **Default**: Today's date or most recent game day

#### 4.1.4 Video Display
- **Embedded Player**:
  - YouTube iframe embed OR
  - Click-through to YouTube (simpler, no embed quota concerns)
- **Video Card/Tile**:
  - Thumbnail
  - Game matchup (e.g., "Lakers vs Suns")
  - Date
  - Duration
  - Upload time/freshness indicator
  - Channel badge (NBA official)

#### 4.1.5 Backend: Schedule Fetching
- **Frequency**: Daily cron job (runs once per day, e.g., 6 AM)
- **Process**:
  1. Fetch NBA schedule for next 7 days and previous 3 days
  2. Store/update games in database
  3. Mark games as scheduled → in_progress → finished based on time
- **API**: Use free NBA schedule API (balldontlie.io or ESPN)

#### 4.1.6 Backend: Video Discovery
- **Trigger**:
  - Automated: Runs 2-4 hours after each game's scheduled end time
  - Manual: Admin endpoint to trigger search for specific game
- **Process**:
  1. Query games from database where status = "finished" and video not found
  2. For each game:
     - Build search query: `"{AWAY_TEAM} at {HOME_TEAM} FULL GAME HIGHLIGHTS {date}"`
     - Search YouTube API with filters:
       - Channel: "NBA" (or whitelisted channels)
       - Upload date: Within 6 hours of game end
       - Duration: 10-20 minutes
     - Parse results, pick best match
     - Store video in database linked to game
  3. Log success/failures for monitoring

#### 4.1.7 YouTube API Integration
- **Setup**:
  - Require API key from Google Cloud Console
  - Store in environment variable (`YOUTUBE_API_KEY`)
  - Document setup process
- **Quota Management**:
  - YouTube API has daily quota limits (10,000 units/day by default)
  - Each search costs ~100 units
  - Monitor usage, implement caching
- **Endpoints Used**:
  - `search.list`: Find videos by query
  - `videos.list`: Get video details (duration, stats)

### 4.2 Nice-to-Have Features (Future/Optional)

#### 4.2.1 Game Start/End Time Tracking
- Track game start time from schedule
- Estimate end time (start + 2.5 hours typical)
- Use this to optimize video search timing
- Display "time since game ended" on UI

#### 4.2.2 Multiple Video Sources
- Support multiple trusted channels beyond just "NBA":
  - Team-specific channels (Lakers, Warriors, etc.)
  - ESPN, Bleacher Report
- Rank/prefer official NBA channel first

#### 4.2.3 Video Quality Indicators
- Show view count
- Show how long ago video was uploaded
- Badge for "official" vs "unofficial" sources

#### 4.2.4 Search Functionality
- Search by team name
- Search by date range
- Search by matchup

---

## 5. User Flows

### 5.1 Primary Flow: Find Team Highlights

```
1. User lands on home page
2. User sees options: "Browse by Team" or "Browse by Date"
3. User selects "Browse by Team"
4. User clicks on "Lakers"
5. App navigates to /team/lakers
6. App displays:
   - "Los Angeles Lakers" header
   - List of recent games:
     * Dec 14: Lakers @ Suns (115-110) [Watch Highlights]
     * Dec 12: Lakers vs Celtics (121-118) [Watch Highlights]
     * Dec 10: Lakers @ Warriors (105-112) [Watch Highlights]
7. User clicks "Watch Highlights" on Dec 14 game
8. Video plays (embedded or new tab to YouTube)
```

### 5.2 Secondary Flow: Browse by Date

```
1. User lands on home page
2. User selects "Browse by Date"
3. User picks December 14, 2024
4. App shows all games from that date:
   - Lakers @ Suns [Watch Highlights]
   - Celtics @ Heat [Watch Highlights]
   - Warriors vs Nuggets [Watch Highlights]
   - (+ more games)
5. User clicks any game to watch
```

### 5.3 Admin/Developer Flow: Manual Video Fetch

```
1. Developer notices a game is missing highlights
2. Developer calls admin API endpoint:
   POST /api/admin/fetch-video/:gameId
3. Backend immediately searches YouTube for that game
4. Returns success/failure response
5. Video now appears on frontend
```

---

## 6. API Endpoints

### 6.1 Public Endpoints

#### GET `/api/teams`
- Returns all NBA teams
- Response: `{ teams: Team[] }`

#### GET `/api/teams/:id/games`
- Returns recent games for a specific team
- Query params: `?limit=10` (default 10)
- Response: `{ games: Game[] }` (includes video if available)

#### GET `/api/games/date/:YYYY-MM-DD`
- Returns all games on a specific date
- Response: `{ games: Game[] }` (includes videos)

#### GET `/api/games/:id`
- Returns single game with video details
- Response: `{ game: Game, video: Video | null }`

### 6.2 Admin Endpoints (Optional for v1)

#### POST `/api/admin/fetch-schedule`
- Manually trigger schedule fetch
- Response: `{ success: boolean, gamesAdded: number }`

#### POST `/api/admin/fetch-videos`
- Manually trigger video search for recent games
- Response: `{ success: boolean, videosFound: number }`

#### POST `/api/admin/fetch-video/:gameId`
- Search for video for specific game
- Response: `{ success: boolean, video: Video | null }`

---

## 7. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Set up React frontend boilerplate
- [ ] Set up Express backend boilerplate
- [ ] Set up PostgreSQL database
- [ ] Create database schema and migrations
- [ ] Seed teams data (30 NBA teams)

### Phase 2: Backend Core (Week 1-2)
- [ ] Implement NBA Schedule API integration
- [ ] Create schedule fetching service
- [ ] Implement YouTube API integration
- [ ] Create video search/matching service
- [ ] Build API endpoints for teams, games, videos

### Phase 3: Frontend Core (Week 2)
- [ ] Build home page with team/date selection
- [ ] Build team page with game list
- [ ] Build date browser page
- [ ] Implement video display/embed
- [ ] Add basic styling and responsive design

### Phase 4: Automation (Week 2-3)
- [ ] Set up cron jobs for schedule fetching
- [ ] Set up automated video discovery
- [ ] Test end-to-end flow over several days
- [ ] Implement error handling and logging

### Phase 5: Polish & Deploy (Week 3)
- [ ] Add loading states and error messages
- [ ] Implement LocalStorage for user preferences
- [ ] Add basic analytics/monitoring
- [ ] Deploy to production
- [ ] Document setup and deployment process

---

## 8. Technical Considerations

### 8.1 YouTube API Quota Management
- **Daily Limit**: 10,000 units (default free tier)
- **Search Cost**: ~100 units per search
- **Strategy**:
  - Cache search results
  - Limit searches to games that actually happened (use schedule)
  - Implement backoff if quota exceeded
  - Consider paid tier if scaling beyond ~100 searches/day

### 8.2 Video Matching Algorithm
Challenge: How to reliably match YouTube videos to specific games

**Approach:**
1. Build structured search query from game data:
   - `"{AWAY_TEAM} at {HOME_TEAM} FULL GAME HIGHLIGHTS {Month} {Day} {Year}"`
   - Example: "LAKERS at SUNS FULL GAME HIGHLIGHTS December 14 2024"

2. Apply filters:
   - Channel ID = "NBA" official channel
   - Upload date within 2-6 hours after game end
   - Duration between 10-20 minutes

3. Title parsing verification:
   - Check title contains both team names
   - Check title contains "HIGHLIGHTS" or similar
   - Check date in title matches game date

4. Fallback strategy:
   - If no match found, retry with looser query after 12/24 hours
   - Log failures for manual review

### 8.3 Data Freshness
- Schedule updates: Daily
- Video searches: 3-4 hours after each game ends
- Frontend cache: Refresh every 30 minutes
- Stale data handling: Show "last updated" timestamp

### 8.4 Error Handling
- API rate limits: Graceful degradation, show cached data
- Missing videos: Show "Highlights coming soon" message
- Network errors: Retry logic with exponential backoff
- User-facing errors: Friendly messages, no technical details exposed

### 8.5 Performance Optimization
- **Frontend**:
  - Lazy load video embeds (only when scrolled into view)
  - Paginate game lists (10-15 per page)
  - Use React.memo for video cards
- **Backend**:
  - Index database on teamId, gameDate
  - Cache frequently accessed team/game data
  - Use connection pooling for database

---

## 9. Future Enhancements (Post-v1)

### 9.1 User Personalization
- Favorite teams feature (stored in localStorage)
- Personalized home page showing only favorite teams' highlights
- Pin favorites to top of team list
- "My Teams" quick navigation

### 9.2 Advanced Filtering
- Filter by division (Atlantic, Central, Southeast, etc.)
- Filter by conference (Eastern, Western)
- Filter by date range
- Filter by game outcome (wins/losses for specific team)

### 9.3 Additional Content Types
- Support other video types:
  - Player highlights (LeBron, Curry, etc.)
  - Top plays of the week
  - Condensed game recaps (5-minute versions)
- Multiple video options per game (different lengths/sources)

### 9.4 Social Features
- Share button for specific highlights
- View count tracking (internal, not just YouTube)
- "Trending" highlights based on engagement

### 9.5 Enhanced UX
- Dark mode / light mode toggle
- Watch history (stored locally)
- Bookmarks/save for later
- Keyboard navigation shortcuts
- Progressive Web App (PWA) for mobile install

### 9.6 Data Analytics
- Track which teams/videos are most popular
- Optimize video search timing based on actual upload patterns
- Dashboard for monitoring system health

### 9.7 Backend Improvements
- Webhook notifications when new highlights are found
- Multiple trusted YouTube channels support
- Automatic quality scoring for video matches
- Admin panel for manual video curation

---

## 10. Success Metrics

### 10.1 Technical Metrics
- **Uptime**: >99% availability
- **Video Discovery Rate**: >90% of games have highlights within 6 hours
- **API Response Time**: <500ms for game list queries
- **YouTube API Quota**: Stay within free tier limits

### 10.2 User Metrics (Future)
- Daily active users
- Average session duration
- Most popular teams
- Videos watched per session

---

## 11. Dependencies & Setup Requirements

### 11.1 Required API Keys
1. **YouTube Data API v3**
   - Create project in Google Cloud Console
   - Enable YouTube Data API v3
   - Generate API key
   - Set quota alerts

2. **NBA Schedule API**
   - Option A: balldontlie.io (free, no key required)
   - Option B: ESPN API (free)
   - Option C: Official NBA stats API (free, but unofficial)

### 11.2 Environment Variables
```bash
# Backend .env
YOUTUBE_API_KEY=your_youtube_api_key
DATABASE_URL=postgresql://user:pass@host:5432/nba_highlights
NBA_API_URL=https://www.balldontlie.io/api/v1
PORT=3001
NODE_ENV=development

# Frontend .env
REACT_APP_API_URL=http://localhost:3001/api
```

### 11.3 Initial Data Seeding
- **Teams**: Seed all 30 NBA teams with conference/division data
- **Schedule**: Initial fetch of current season schedule
- **Videos**: Backfill recent games (last 7 days)

---

## 12. Out of Scope (v1)

The following are explicitly NOT included in the initial version:
- User authentication/accounts
- Backend-stored user preferences
- Live game scores/updates
- Commenting or social features
- Mobile native apps (web-only initially)
- Playoff bracket visualization
- Player statistics integration
- Multiple sports support
- Video downloading/offline viewing
- Custom video playlists

---

## Questions & Decisions Log

### Open Questions
1. Should we display games without videos, or hide them until video is found?
   - **Decision**: Display all games, show "Highlights coming soon" if video not yet available

2. How far back should we fetch historical games?
   - **Decision**: Start with current season only (October onwards)

3. Should we refresh video metadata (view counts, etc.) regularly?
   - **Decision**: No, fetch once and store. Reduces API usage.

4. YouTube embed vs. link out?
   - **Decision**: Start with direct links (simpler), add embed later if desired

### Assumptions
- NBA official channel consistently uploads ~15min highlights for every game
- Highlights are typically uploaded 2-4 hours after game ends
- Users primarily care about recent games (last 2 weeks)
- Users access via desktop web browser primarily

---

## Appendix A: NBA Channel Video Title Format

Based on your example: **"LAKERS at SUNS | FULL GAME HIGHLIGHTS | December 14, 2025"**

**Format Pattern**:
```
{AWAY_TEAM} at {HOME_TEAM} | FULL GAME HIGHLIGHTS | {Month} {Day}, {Year}
```

**Search Query Strategy**:
```javascript
const searchQuery = `${awayTeam} at ${homeTeam} FULL GAME HIGHLIGHTS ${formattedDate}`;
// Example: "LAKERS at SUNS FULL GAME HIGHLIGHTS December 14 2024"
```

**Title Parsing Regex**:
```javascript
const regex = /^(\w+)\s+at\s+(\w+)\s+\|\s+FULL GAME HIGHLIGHTS\s+\|\s+(\w+)\s+(\d+),\s+(\d{4})$/;
```

---

## Appendix B: NBA Teams Reference

| Team | Abbreviation | Conference | Division |
|------|--------------|------------|----------|
| Atlanta Hawks | ATL | Eastern | Southeast |
| Boston Celtics | BOS | Eastern | Atlantic |
| Brooklyn Nets | BKN | Eastern | Atlantic |
| Charlotte Hornets | CHA | Eastern | Southeast |
| Chicago Bulls | CHI | Eastern | Central |
| Cleveland Cavaliers | CLE | Eastern | Central |
| Dallas Mavericks | DAL | Western | Southwest |
| Denver Nuggets | DEN | Western | Northwest |
| Detroit Pistons | DET | Eastern | Central |
| Golden State Warriors | GSW | Western | Pacific |
| Houston Rockets | HOU | Western | Southwest |
| Indiana Pacers | IND | Eastern | Central |
| LA Clippers | LAC | Western | Pacific |
| Los Angeles Lakers | LAL | Western | Pacific |
| Memphis Grizzlies | MEM | Western | Southwest |
| Miami Heat | MIA | Eastern | Southeast |
| Milwaukee Bucks | MIL | Eastern | Central |
| Minnesota Timberwolves | MIN | Western | Northwest |
| New Orleans Pelicans | NOP | Western | Southwest |
| New York Knicks | NYK | Eastern | Atlantic |
| Oklahoma City Thunder | OKC | Western | Northwest |
| Orlando Magic | ORL | Eastern | Southeast |
| Philadelphia 76ers | PHI | Eastern | Atlantic |
| Phoenix Suns | PHX | Western | Pacific |
| Portland Trail Blazers | POR | Western | Northwest |
| Sacramento Kings | SAC | Western | Pacific |
| San Antonio Spurs | SAS | Western | Southwest |
| Toronto Raptors | TOR | Eastern | Atlantic |
| Utah Jazz | UTA | Western | Northwest |
| Washington Wizards | WAS | Eastern | Southeast |

---

**End of Product Requirements Document**

_This document is a living document and will be updated as requirements evolve._
