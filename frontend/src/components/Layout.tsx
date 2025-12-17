import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { usePreferences } from '../hooks/usePreferences';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const todayPath = `/date/${new Date().toISOString().split('T')[0]}`;

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <BasketballIcon className="w-8 h-8 text-orange-500" />
            <span className="font-bold text-xl text-gray-900">
              NBA Highlights
            </span>
          </Link>

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

          <div className="hidden md:block">
            <QuickTeamSearch />
          </div>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            aria-label="Open menu"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </header>
  );
}

function QuickTeamSearch() {
  const [query, setQuery] = useState('');
  const [teams, setTeams] = useState<Array<{ abbreviation: string; name: string }>>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadTeams() {
      try {
        const data = await apiClient.get<Array<{ abbreviation: string; name: string }>>('/teams');
        setTeams(data.map(t => ({
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
            <button
              key={team.abbreviation}
              onClick={() => {
                navigate(`/team/${team.abbreviation.toLowerCase()}`);
                setQuery('');
                setShowDropdown(false);
              }}
              className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
            >
              <span className="font-medium">{team.abbreviation}</span>
              <span className="text-gray-500 ml-2">{team.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const todayPath = `/date/${new Date().toISOString().split('T')[0]}`;

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
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

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

          <div className="mt-6">
            <h3 className="px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">
              {preferences.recentTeams.length > 0 ? 'Recent Teams' : 'Popular Teams'}
            </h3>
            <ul className="mt-2 space-y-1">
              {(preferences.recentTeams.length > 0
                ? preferences.recentTeams
                : [
                    { abbreviation: 'LAL', name: 'Lakers' },
                    { abbreviation: 'GSW', name: 'Warriors' },
                    { abbreviation: 'BOS', name: 'Celtics' },
                    { abbreviation: 'MIA', name: 'Heat' },
                    { abbreviation: 'CHI', name: 'Bulls' },
                  ]
              ).map((team) => (
                <li key={team.abbreviation}>
                  <button
                    onClick={() => {
                      navigate(`/team/${team.abbreviation.toLowerCase()}`);
                      onClose();
                    }}
                    className="block w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700"
                  >
                    <span className="font-medium">{team.abbreviation}</span>
                    <span className="ml-2 text-gray-500">{team.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </div>
  );
}

function Footer() {
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

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
