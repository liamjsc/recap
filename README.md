# NBA Highlights Aggregator

A streamlined web application that aggregates NBA game highlight videos from YouTube, making it effortless for fans to find and watch highlights for any team or recent game.

## Features

- Browse highlights by team or date
- Instant access to YouTube highlights
- Official NBA channel videos
- Mobile-friendly design

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Neon)
- **External APIs**: YouTube Data API, NBA Schedule API

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL (local or Neon)
- YouTube Data API key

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd nba-highlights
   ```

2. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install

   # Install backend dependencies
   cd ../backend
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Frontend
   cp frontend/.env.example frontend/.env

   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database URL and API keys
   ```

4. Run database migrations:
   ```bash
   cd backend
   npm run migrate
   npm run db:seed
   ```

5. Start development servers:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

6. Open http://localhost:5173 in your browser

## Project Structure

```
/
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page components
│   │   ├── api/        # API client
│   │   ├── hooks/      # Custom React hooks
│   │   └── types/      # TypeScript types
│   └── ...
├── backend/            # Express API server
│   ├── src/
│   │   ├── routes/     # API routes
│   │   ├── services/   # Business logic
│   │   ├── db/         # Database queries
│   │   ├── middleware/ # Express middleware
│   │   └── jobs/       # Cron jobs
│   └── ...
├── claude/prd/tasks/   # Implementation task definitions
└── ...
```

## API Endpoints

### Public Endpoints

- `GET /api/teams` - List all NBA teams
- `GET /api/teams/:id/games` - Get team's recent games
- `GET /api/games/date/:date` - Get all games on a date
- `GET /health` - Health check

### Admin Endpoints

Require `X-Admin-API-Key` header.

- `POST /api/admin/fetch-schedule` - Trigger schedule sync
- `POST /api/admin/fetch-videos` - Trigger video discovery

## Environment Variables

### Backend

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key |
| `ADMIN_API_KEY` | Admin endpoint authentication |
| `CORS_ORIGINS` | Allowed CORS origins |

### Frontend

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |

## License

MIT

---

*Not affiliated with the NBA. Videos provided by NBA on YouTube.*
