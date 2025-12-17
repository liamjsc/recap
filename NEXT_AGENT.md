# Handoff to Next Agent - Frontend Implementation

## 🎯 Your Mission

Implement the frontend React application for the NBA Highlights Aggregator. The backend is **100% complete and fully functional** - you just need to build the UI that consumes the existing APIs.

## ✅ What's Already Done

**Backend is fully operational:**
- ✅ Database with 30 NBA teams seeded
- ✅ Complete REST API with teams, games endpoints
- ✅ YouTube video discovery integrated
- ✅ NBA schedule sync integrated
- ✅ All TypeScript compiles, all tests pass

**Frontend boilerplate exists but needs implementation:**
- ✅ React + Vite + TypeScript + Tailwind setup
- ✅ Routing structure (react-router-dom)
- ✅ Basic layout component
- ⚠️ Pages are stubs - need real implementation

## 🚀 Quick Start

### 1. Get Some Data First
```bash
cd backend
npm run sync:schedule  # Fetch NBA games for upcoming week
npm run sync:videos    # Discover highlight videos (if games are finished)
```

### 2. Start Both Servers
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 3. Test the Backend APIs
```bash
curl http://localhost:3001/api/teams
curl http://localhost:3001/api/games?date=2024-12-15
```

## 📋 What You Need to Build

### Phase 5: Frontend Implementation

Refer to `./claude/prd/tasks/phase-5/` for detailed task breakdowns. Here's the summary:

**1. Home Page** (`src/pages/HomePage.tsx`)
- Fetch recent games from `/api/games`
- Display game cards with:
  - Team names and logos (can use abbreviations)
  - Game date and time
  - Scores (if finished)
  - Video thumbnail (if available)
- Filter by date range
- Click game to see details

**2. Team Page** (`src/pages/TeamPage.tsx`)
- Fetch team by ID from `/api/teams/:id`
- Fetch team's games from `/api/teams/:id/games`
- Display team info (name, conference, division)
- Show team's schedule with videos
- Filter by date range or status

**3. Date Page** (`src/pages/DatePage.tsx`)
- Date picker component
- Fetch games for selected date: `/api/games?date=YYYY-MM-DD`
- Display all games for that day
- Show videos if available

**4. Video Player Component** (`src/components/VideoPlayer.tsx`)
- YouTube embed using `video.url` or `video.youtubeVideoId`
- Responsive iframe
- Video metadata display (title, channel, duration)
- Handle missing videos gracefully

**5. Navigation** (`src/components/Layout.tsx`)
- Links to Home, Teams list, Date picker
- NBA branding (already has Tailwind colors configured)

## 📚 Key Files to Reference

### API Client (already created)
- `frontend/src/api/client.ts` - Base fetch wrapper with error handling
- `frontend/src/types/index.ts` - TypeScript interfaces matching backend

### Backend Types (for reference)
```typescript
interface TeamResponse {
  id: number;
  name: string;
  fullName: string;
  abbreviation: string;
  conference: string;
  division: string;
}

interface GameResponse {
  id: number;
  gameDate: string;        // YYYY-MM-DD
  gameTime: string | null; // ISO 8601
  status: 'scheduled' | 'in_progress' | 'finished';
  homeTeam: TeamBriefResponse;
  awayTeam: TeamBriefResponse;
  homeScore: number | null;
  awayScore: number | null;
  video: VideoResponse | null;
}

interface VideoResponse {
  id: number;
  youtubeVideoId: string;
  title: string;
  thumbnailUrl: string;
  durationSeconds: number;
  channelName: string;
  isVerified: boolean;
  url: string;  // YouTube watch URL
}
```

### API Endpoints Available
```
GET /api/teams                           # List all 30 teams
GET /api/teams/:id                       # Single team
GET /api/teams/:id/games                 # Team's games
GET /api/games?date=YYYY-MM-DD          # Games on specific date
GET /api/games?startDate=X&endDate=Y    # Games in date range
GET /api/games/:id                       # Single game with video
```

## 💡 Implementation Tips

### Use the API Client
```typescript
import { apiClient } from '../api/client';

// Example: Fetch teams
const teams = await apiClient.get<TeamResponse[]>('/teams');

// Example: Fetch games by date
const games = await apiClient.get<GameResponse[]>(`/games?date=2024-12-15`);
```

### YouTube Embed
```typescript
// If video exists, embed like this:
{video && (
  <iframe
    width="560"
    height="315"
    src={`https://www.youtube.com/embed/${video.youtubeVideoId}`}
    title={video.title}
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
  />
)}
```

### Tailwind NBA Colors (already configured)
```javascript
colors: {
  nba: {
    blue: '#1d428a',
    red: '#c8102e',
    white: '#ffffff',
  }
}
```

### Loading States
```typescript
const [loading, setLoading] = useState(true);
const [data, setData] = useState<GameResponse[]>([]);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    const result = await apiClient.get<GameResponse[]>('/games');
    setData(result);
    setLoading(false);
  };
  fetchData();
}, []);

if (loading) return <div>Loading...</div>;
```

## 🎨 Design Considerations

- **Keep it simple** - This is a functional MVP, not a design showcase
- **Responsive** - Should work on mobile and desktop
- **Error handling** - Show user-friendly messages when APIs fail
- **Loading states** - Show spinners while fetching data
- **Empty states** - Handle no games/videos gracefully
- **Date formatting** - Use `new Date(gameDate).toLocaleDateString()`

## 📖 Additional Resources

- **PRD**: `./PRD.md` - Full product requirements
- **Technical Plan**: `./TECHNICAL_IMPLEMENTATION_PLAN.md`
- **Task Definitions**: `./claude/prd/tasks/phase-5/` (6 detailed task files)
- **Context Doc**: `./CLAUDE.md` - Complete project context

## 🔧 Troubleshooting

### Backend not responding?
```bash
cd backend && npm run dev
# Check http://localhost:3001/health
```

### CORS issues?
Backend already configured to accept `http://localhost:5173`

### No games showing?
Run `cd backend && npm run sync:schedule` to fetch games from NBA API

### No videos?
Videos only exist for finished games. Run `cd backend && npm run sync:videos` after games finish.

## ✨ Success Criteria

Your implementation is complete when:
1. ✅ Users can browse all 30 NBA teams
2. ✅ Users can view games by date
3. ✅ Users can see team schedules
4. ✅ Videos play in embedded YouTube player
5. ✅ Navigation works between all pages
6. ✅ App is responsive and looks decent
7. ✅ All TypeScript compiles without errors

## 🚀 After Frontend is Done

The next agent will handle:
- **Phase 6**: Deployment to Vercel
- **Phase 7**: Monitoring and operations

---

**Good luck!** The backend is rock-solid and ready to serve data. Just build a clean UI and you're done! 🏀
