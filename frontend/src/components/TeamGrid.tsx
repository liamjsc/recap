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
        const data = await apiClient.get<Team[]>('/teams');
        setTeams(data);
      } catch {
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
    if (filteredTeams?.length === undefined) {
      debugger;;
    }

  const divisions: Record<string, Team[]> = {};
  filteredTeams.map(team => {
    const div = team.division;
    if (!divisions[div]) {
      divisions[div] = [];
    }
    divisions[div].push(team);
    return null;
  });

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
