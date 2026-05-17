import { useState, useEffect } from 'react';
import apiClient from '../api/client';

const ResultsView = ({ projectId, refreshTrigger }) => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(`/analytics/${projectId}/ranking`);
        setResults(response.data);
      } catch (err) {
        if (err.response && err.response.status === 400) {
          setError(
            err.response.data.error ||
              'Please fill in all matrix values to calculate rankings.',
          );
        } else {
          setError('An error occurred while calculating the results.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (projectId) fetchResults();
  }, [projectId, refreshTrigger]);

  if (loading)
    return (
      <div className="py-12 text-center text-gray-500 font-medium animate-pulse">
        Calculating optimal decisions...
      </div>
    );
  if (error) {
    return (
      <div className="p-6 bg-orange-50 text-orange-800 rounded-xl border border-orange-200 flex justify-between items-start shadow-sm animate-in fade-in">
        <div className="flex gap-3">
          <svg
            className="w-6 h-6 text-orange-500 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h4 className="font-bold">Calculation Error</h4>
            <p className="mt-1 text-sm text-orange-700">{error}</p>
          </div>
        </div>
        <button
          onClick={() => setError(null)}
          className="p-1.5 text-orange-500 hover:text-orange-800 hover:bg-orange-100 rounded-md transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    );
  }
  if (!results) return null;

  // Find max score to scale the bar chart properly
  const maxScore = Math.max(...results.rankings.map((r) => r.additiveScore));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl shadow-sm">
        <h3 className="text-xl font-bold text-blue-900 mb-2">
          System Analysis Log
        </h3>
        {results.analysisLog && results.analysisLog.length > 0 ? (
          <ul className="text-blue-800 leading-relaxed list-disc pl-5 space-y-1">
            {results.analysisLog.map((log, idx) => (
              <li key={idx}>{log}</li>
            ))}
          </ul>
        ) : (
          <p className="text-blue-800 leading-relaxed">
            No analysis logs available.
          </p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Alternatives Ranking
        </h3>
        <div className="space-y-4">
          {results.rankings.map((alt, index) => {
            const percentage =
              maxScore > 0 ? (alt.additiveScore / maxScore) * 100 : 0;
            return (
              <div
                key={alt.id}
                className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm relative overflow-hidden"
              >
                <div className="flex justify-between items-end mb-2 relative z-10">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${index === 0 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}
                    >
                      #{index + 1}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {alt.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {alt.additiveScore.toFixed(4)}
                    </div>
                    <div className="text-xs text-gray-500">
                      WPM: {alt.multiplicativeScore} | Min: {alt.cautiousScore}
                    </div>
                  </div>
                </div>
                {/* Visual Bar */}
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${index === 0 ? 'bg-amber-400' : 'bg-blue-500'}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ResultsView;
