import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Game } from '../types';

interface DateInfo {
  date: string;
  displayDate: string;
  isToday: boolean;
  prevDate: string;
  nextDate: string;
}

interface DateGamesData {
  games: Game[];
  loading: boolean;
  error: string | null;
  dateInfo: DateInfo | null;
}

export function useDateGames(date: string): DateGamesData {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateInfo, setDateInfo] = useState<DateInfo | null>(null);

  useEffect(() => {
    if (!date || !isValidDate(date)) {
      setLoading(false);
      setError('Invalid date format');
      return;
    }

    async function fetchGames() {
      setLoading(true);
      setError(null);

      try {
        const data = await apiClient.get<Game[]>(
          `/games?date=${date}`
        );
        // Ensure we always have an array so downstream code can safely use games.length
        setGames(data ?? []);
        setDateInfo(buildDateInfo(date));
      } catch {
        setError('Failed to load games');
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
  }, [date]);

  return { games, loading, error, dateInfo };
}

function isValidDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr + 'T12:00:00');
  return !isNaN(date.getTime());
}

function buildDateInfo(dateStr: string): DateInfo {
  const date = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateNormalized = new Date(date);
  dateNormalized.setHours(0, 0, 0, 0);

  const prevDate = new Date(date);
  prevDate.setDate(prevDate.getDate() - 1);

  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);

  const displayDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return {
    date: dateStr,
    displayDate,
    isToday: dateNormalized.getTime() === today.getTime(),
    prevDate: prevDate.toISOString().slice(0, 10),
    nextDate: nextDate.toISOString().slice(0, 10),
  };
}
