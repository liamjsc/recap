import { useParams, Link } from 'react-router-dom';

export function TeamPage() {
  const { abbreviation } = useParams<{ abbreviation: string }>();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link to="/" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Home
      </Link>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Team: {abbreviation?.toUpperCase()}
      </h1>
      <p className="text-gray-500">
        Team page coming soon - Recent games will appear here
      </p>
    </div>
  );
}
