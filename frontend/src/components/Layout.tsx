import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          <a href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏀</span>
            <span className="font-bold text-xl text-gray-900">NBA Highlights</span>
          </a>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-gray-900 text-gray-400 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>NBA Highlights Aggregator - Not affiliated with the NBA</p>
        </div>
      </footer>
    </div>
  );
}
