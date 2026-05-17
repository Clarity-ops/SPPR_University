import { useState } from 'react';
import apiClient from '../api/client';

export default function ExpertiseMathPanel({ projectId, onSuccess }) {
  const [consensusMethod, setConsensusMethod] = useState('median');
  const [weightsMethod, setWeightsMethod] = useState('borda');
  const [isConsensusLoading, setIsConsensusLoading] = useState(false);
  const [isWeightsLoading, setIsWeightsLoading] = useState(false);

  const handleApplyConsensus = async () => {
    setIsConsensusLoading(true);
    try {
      await apiClient.post(`/experts/project/${projectId}/consensus`, {
        method: consensusMethod,
      });
      alert('Consensus applied successfully!');
      onSuccess();
    } catch (error) {
      console.error('Consensus error:', error);
      alert('Failed to apply consensus. Please try again.');
    } finally {
      setIsConsensusLoading(false);
    }
  };

  const handleCalculateWeights = async () => {
    setIsWeightsLoading(true);
    try {
      await apiClient.post(`/experts/project/${projectId}/weights-voting`, {
        method: weightsMethod,
      });
      alert('Criteria weights calculated successfully!');
      onSuccess();
    } catch (error) {
      console.error('Weights calculation error:', error);
      alert('Failed to calculate weights. Please try again.');
    } finally {
      setIsWeightsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm animate-in fade-in duration-500">
      <h2 className="text-lg font-bold text-gray-900 mb-6">
        Expertise Aggregation & Math
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Column 1: Evaluate Alternatives (Consensus) */}
        <div>
          <h3 className="text-md font-semibold text-gray-800 mb-3">
            Evaluate Alternatives
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Merge expert alternative evaluations into a single main matrix using
            the selected consensus method.
          </p>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Consensus Method
          </label>
          <select
            value={consensusMethod}
            onChange={(e) => setConsensusMethod(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 w-full mb-4"
          >
            <option value="arithmetic">Arithmetic Mean</option>
            <option value="geometric">Geometric Mean</option>
            <option value="median">Median</option>
          </select>

          <button
            onClick={handleApplyConsensus}
            disabled={isConsensusLoading}
            className="bg-blue-600 text-white rounded-lg hover:bg-blue-700 px-4 py-2 disabled:opacity-50 transition-colors w-full"
          >
            {isConsensusLoading ? 'Applying...' : 'Apply Consensus'}
          </button>
        </div>

        {/* Column 2: Calculate Criteria Weights (Voting) */}
        <div>
          <h3 className="text-md font-semibold text-gray-800 mb-3">
            Calculate Criteria Weights
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Calculate the final percentage weights of criteria based on expert
            rankings using the selected voting method.
          </p>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voting Method
          </label>
          <select
            value={weightsMethod}
            onChange={(e) => setWeightsMethod(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 w-full mb-4"
          >
            <option value="relative_majority">Relative Majority</option>
            <option value="borda">Borda Rule</option>
            <option value="copeland">Copeland Rule</option>
            <option value="simpson">Simpson Rule</option>
          </select>

          <button
            onClick={handleCalculateWeights}
            disabled={isWeightsLoading}
            className="bg-blue-600 text-white rounded-lg hover:bg-blue-700 px-4 py-2 disabled:opacity-50 transition-colors w-full"
          >
            {isWeightsLoading ? 'Calculating...' : 'Calculate Weights'}
          </button>
        </div>
      </div>
    </div>
  );
}
