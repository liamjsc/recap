# Task: Implement Home Page Component

## Task ID
`phase-5/001-home-page-component`

## Description
Create the landing page that provides users with navigation options to browse NBA highlights by team or by date.

## Prerequisites
- `phase-0/002-frontend-boilerplate` completed

## Expected Outcomes
1. Home page with clear value proposition
2. Team browser section with all 30 NBA teams
3. Date browser section with calendar picker
4. Responsive design for mobile and desktop

## Deliverables

### File Structure
```
frontend/src/
├── pages/
│   └── HomePage.tsx
├── components/
│   ├── TeamGrid.tsx
│   ├── TeamCard.tsx
│   ├── DatePicker.tsx
│   └── Hero.tsx
```

### Home Page Component
```typescript
// frontend/src/pages/HomePage.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { TeamGrid } from '../components/TeamGrid';
import { DatePicker } from '../components/DatePicker';

type BrowseMode = 'team' | 'date';

export function HomePage() {
  const navigate = useNavigate();
  const [browseMode, setBrowseMode] = useState<BrowseMode>('team');

  const handleTeamSelect = (abbreviation: string) => {
    navigate(`/team/${abbreviation.toLowerCase()}`);
  };

  const handleDateSelect = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    navigate(`/date/${dateStr}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />

      {/* Browse Mode Selector */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setBrowseMode('team')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              browseMode === 'team'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Browse by Team
          </button>
          <button
            onClick={() => setBrowseMode('date')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              browseMode === 'date'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Browse by Date
          </button>
        </div>

        {/* Content based on mode */}
        {browseMode === 'team' ? (
          <TeamGrid onTeamSelect={handleTeamSelect} />
        ) : (
          <DatePicker onDateSelect={handleDateSelect} />
        )}
      </div>
    </div>
  );
}
```

### Hero Component
```typescript
// frontend/src/components/Hero.tsx

export function Hero() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          NBA Highlights
        </h1>
        <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto">
          Find and watch full game highlights for any NBA team.
          Never miss a moment from your favorite teams.
        </p>
      </div>
    </div>
  );
}
```

### Team Grid Component
```typescript
// frontend/src/components/TeamGrid.tsx

import { useEffect, useState } from 'react';
import { TeamCard } from './TeamCard';
import { apiClient } from '../api/client';
import { Team } from '../types';

interface Props {
  onTeamSelect: (abbreviation: string) => void;
}

export function TeamGrid({ onTeamSelect }: Props) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'Eastern' | 'Western'>('all');

  useEffect(() => {
    async function loadTeams() {
      try {
        const data = await apiClient.get<{ teams: Team[] }>('/teams');
        setTeams(data.teams);
      } catch (err) {
        setError('Failed to load teams');
      } finally {
        setLoading(false);
      }
    }

    loadTeams();
  }, []);

  const filteredTeams = filter === 'all'
    ? teams
    : teams.filter(t => t.conference === filter);

  // Group by division
  const divisions = filteredTeams.reduce((acc, team) => {
    if (!acc[team.division]) {
      acc[team.division] = [];
    }
    acc[team.division].push(team);
    return acc;
  }, {} as Record<string, Team[]>);

  if (loading) {
    return <TeamGridSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-blue-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Conference Filter */}
      <div className="flex justify-center gap-2 mb-6">
        {(['all', 'Eastern', 'Western'] as const).map((conf) => (
          <button
            key={conf}
            onClick={() => setFilter(conf)}
            className={`px-4 py-2 rounded text-sm font-medium ${
              filter === conf
                ? 'bg-gray-900 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {conf === 'all' ? 'All Teams' : `${conf} Conference`}
          </button>
        ))}
      </div>

      {/* Teams by Division */}
      {Object.entries(divisions)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([division, divTeams]) => (
          <div key={division} className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              {division} Division
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {divTeams
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    onClick={() => onTeamSelect(team.abbreviation)}
                  />
                ))}
            </div>
          </div>
        ))}
    </div>
  );
}

function TeamGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="h-24 bg-gray-200 rounded-lg animate-pulse"
        />
      ))}
    </div>
  );
}
```

### Team Card Component
```typescript
// frontend/src/components/TeamCard.tsx

import { Team } from '../types';

interface Props {
  team: Team;
  onClick: () => void;
}

export function TeamCard({ team, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer border border-gray-100 hover:border-blue-300"
    >
      {/* Placeholder for team logo - could add real logos later */}
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
        <span className="text-sm font-bold text-gray-600">
          {team.abbreviation}
        </span>
      </div>
      <span className="text-sm font-medium text-gray-900 text-center">
        {team.name}
      </span>
    </button>
  );
}
```

### Date Picker Component
```typescript
// frontend/src/components/DatePicker.tsx

import { useState } from 'react';

interface Props {
  onDateSelect: (date: Date) => void;
}

export function DatePicker({ onDateSelect }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handleSubmit = () => {
    onDateSelect(selectedDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Select a Date
        </h3>

        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Previous day"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>

          <div className="text-center">
            <div className="text-xl font-semibold text-gray-900">
              {formatDate(selectedDate)}
            </div>
            {isToday(selectedDate) && (
              <span className="text-sm text-blue-600">Today</span>
            )}
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Next day"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Native date input for jumping to specific date */}
        <div className="mb-6">
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          View Games
        </button>
      </div>
    </div>
  );
}

// Simple icon components
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
```

### Types
```typescript
// frontend/src/types/index.ts

export interface Team {
  id: number;
  name: string;
  fullName: string;
  abbreviation: string;
  conference: 'Eastern' | 'Western';
  division: string;
}
```

## Acceptance Criteria
- [ ] Home page renders with hero section
- [ ] "Browse by Team" shows all 30 teams
- [ ] Teams grouped by division
- [ ] Conference filter works correctly
- [ ] Clicking team navigates to `/team/:abbreviation`
- [ ] "Browse by Date" shows date picker
- [ ] Date navigation (prev/next) works
- [ ] Clicking "View Games" navigates to `/date/:date`
- [ ] Loading skeleton shown while teams load
- [ ] Error state shown on API failure
- [ ] Responsive on mobile devices

## Technical Notes
- Use native date input for accessibility
- Team logos can be added as future enhancement
- Consider lazy loading team grid for performance
- Local storage could remember last browse mode

## Estimated Complexity
Medium - Multiple components with state and API calls

## Dependencies
- Task `phase-0/002-frontend-boilerplate`
