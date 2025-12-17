import { useParams, Link } from 'react-router-dom';

export function DatePage() {
  const { date } = useParams<{ date: string }>();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link to="/" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Home
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Games on {date}
      </h1>
      <p className="text-gray-500">
        Date page coming soon - All games from this date will appear here
      </p>
    </div>
  );
}
