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

        <div className="mb-6">
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value + 'T12:00:00'))}
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
