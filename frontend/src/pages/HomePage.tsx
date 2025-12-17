import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { TeamGrid } from '../components/TeamGrid';
import { DatePicker } from '../components/DatePicker';
import { usePreferences } from '../hooks/usePreferences';

type BrowseMode = 'team' | 'date';

export function HomePage() {
  const navigate = useNavigate();
  const { preferences, setDefaultBrowseMode } = usePreferences();
  const [browseMode, setBrowseMode] = useState<BrowseMode>(
    preferences.defaultBrowseMode
  );

  const handleTeamSelect = (abbreviation: string) => {
    navigate(`/team/${abbreviation.toLowerCase()}`);
  };

  const handleDateSelect = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    navigate(`/date/${dateStr}`);
  };

  const handleModeChange = (mode: BrowseMode) => {
    setBrowseMode(mode);
    setDefaultBrowseMode(mode);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {preferences.recentTeams.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Recently Viewed
            </h2>
            <div className="flex gap-2 flex-wrap">
              {preferences.recentTeams.map((team) => (
                <button
                  key={team.abbreviation}
                  onClick={() =>
                    navigate(`/team/${team.abbreviation.toLowerCase()}`)
                  }
                  className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition text-sm font-medium"
                >
                  {team.abbreviation} - {team.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => handleModeChange('team')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              browseMode === 'team'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Browse by Team
          </button>
          <button
            onClick={() => handleModeChange('date')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              browseMode === 'date'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Browse by Date
          </button>
        </div>

        {browseMode === 'team' ? (
          <TeamGrid onTeamSelect={handleTeamSelect} />
        ) : (
          <DatePicker onDateSelect={handleDateSelect} />
        )}
      </div>
    </div>
  );
}
