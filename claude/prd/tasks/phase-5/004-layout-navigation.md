# Task: Implement Layout and Navigation

## Task ID
`phase-5/004-layout-navigation`

## Description
Create the shared layout component with header navigation, footer, and responsive mobile menu.

## Prerequisites
- `phase-5/003-date-page-component` completed

## Expected Outcomes
1. Consistent header across all pages
2. Navigation with quick links
3. Mobile-responsive hamburger menu
4. Footer with app info

## Deliverables

### File Structure
```
frontend/src/
├── components/
│   ├── Layout.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── MobileMenu.tsx
```

### Layout Component
```typescript
// frontend/src/components/Layout.tsx

import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
```

### Header Component
```typescript
// frontend/src/components/Header.tsx

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MobileMenu } from './MobileMenu';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const todayPath = `/date/${new Date().toISOString().split('T')[0]}`;

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <BasketballIcon className="w-8 h-8 text-orange-500" />
            <span className="font-bold text-xl text-gray-900">
              NBA Highlights
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition ${
                isActive('/')
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Home
            </Link>
            <Link
              to={todayPath}
              className={`text-sm font-medium transition ${
                location.pathname.startsWith('/date')
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Today's Games
            </Link>
          </nav>

          {/* Quick Team Search (Desktop) */}
          <div className="hidden md:block">
            <QuickTeamSearch />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            aria-label="Open menu"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </header>
  );
}

// Quick team search dropdown
function QuickTeamSearch() {
  const [query, setQuery] = useState('');
  const [teams, setTeams] = useState<Array<{ abbreviation: string; name: string }>>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Load teams once
    async function loadTeams() {
      try {
        const data = await apiClient.get<{ teams: any[] }>('/teams');
        setTeams(data.teams.map(t => ({
          abbreviation: t.abbreviation,
          name: t.name,
        })));
      } catch {
        // Ignore errors
      }
    }
    loadTeams();
  }, []);

  const filteredTeams = query
    ? teams.filter(t =>
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.abbreviation.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search teams..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        className="w-48 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {showDropdown && filteredTeams.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg">
          {filteredTeams.map((team) => (
            <Link
              key={team.abbreviation}
              to={`/team/${team.abbreviation.toLowerCase()}`}
              className="block px-3 py-2 hover:bg-gray-50 text-sm"
              onClick={() => {
                setQuery('');
                setShowDropdown(false);
              }}
            >
              <span className="font-medium">{team.abbreviation}</span>
              <span className="text-gray-500 ml-2">{team.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Icons
function BasketballIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2"/>
      <path d="M4.93 4.93c4.08 4.08 4.08 10.06 0 14.14M19.07 4.93c-4.08 4.08-4.08 10.06 0 14.14" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
```

### Mobile Menu Component
```typescript
// frontend/src/components/MobileMenu.tsx

import { Link } from 'react-router-dom';
import { useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: Props) {
  const todayPath = `/date/${new Date().toISOString().split('T')[0]}`;

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Menu Panel */}
      <div className="fixed inset-y-0 right-0 w-64 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-semibold text-lg">Menu</span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Close menu"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link
                to="/"
                onClick={onClose}
                className="block px-4 py-3 rounded-lg hover:bg-gray-100 font-medium"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to={todayPath}
                onClick={onClose}
                className="block px-4 py-3 rounded-lg hover:bg-gray-100 font-medium"
              >
                Today's Games
              </Link>
            </li>
          </ul>

          {/* Popular Teams */}
          <div className="mt-6">
            <h3 className="px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Popular Teams
            </h3>
            <ul className="mt-2 space-y-1">
              {['LAL', 'GSW', 'BOS', 'MIA', 'CHI'].map((abbr) => (
                <li key={abbr}>
                  <Link
                    to={`/team/${abbr.toLowerCase()}`}
                    onClick={onClose}
                    className="block px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                  >
                    {abbr}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </div>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
```

### Footer Component
```typescript
// frontend/src/components/Footer.tsx

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <span className="font-bold text-white">NBA Highlights</span>
            <p className="text-sm mt-1">
              Find and watch full game highlights for every NBA game.
            </p>
          </div>

          <div className="text-sm text-center md:text-right">
            <p>
              Videos provided by{' '}
              <a
                href="https://www.youtube.com/@NBA"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                NBA on YouTube
              </a>
            </p>
            <p className="mt-1">
              Not affiliated with the NBA.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

### Update Router Configuration
```typescript
// frontend/src/App.tsx

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { TeamPage } from './pages/TeamPage';
import { DatePage } from './pages/DatePage';
import { NotFoundPage } from './pages/NotFoundPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'team/:abbreviation', element: <TeamPage /> },
      { path: 'date/:date', element: <DatePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
```

### Not Found Page
```typescript
// frontend/src/pages/NotFoundPage.tsx

import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
```

## Acceptance Criteria
- [ ] Header appears on all pages
- [ ] Logo links to home page
- [ ] "Today's Games" links to current date
- [ ] Quick team search works on desktop
- [ ] Mobile menu opens/closes correctly
- [ ] Mobile menu links navigate and close menu
- [ ] Body scroll locked when mobile menu open
- [ ] Footer visible on all pages
- [ ] 404 page for invalid routes
- [ ] Header is sticky on scroll

## Technical Notes
- Use React Router's Outlet for nested layouts
- Mobile menu uses fixed positioning
- Lock body scroll when menu is open
- Consider adding keyboard navigation (ESC to close)

## Estimated Complexity
Medium - Layout with responsive navigation

## Dependencies
- Task `phase-5/003-date-page-component`
