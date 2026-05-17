import React, { useState, useMemo } from 'react';
import apiClient from '../api/client';
import ExpertiseMathPanel from './ExpertiseMathPanel';

const MatrixTable = ({
  alternatives,
  criteria,
  evaluations,
  projectId,
  onEvaluationUpdated,
  onAggregationSuccess,
  onEditAlternative,
  onDeleteAlternative,
  onEditCriterion,
  onDeleteCriterion,
}) => {
  const originalValues = useMemo(() => {
    const map = {};
    evaluations.forEach((e) => {
      map[`${e.alternative_id}_${e.criterion_id}`] = e.value;
    });
    return map;
  }, [evaluations]);

  const [localEdits, setLocalEdits] = useState({});
  const [savingStatus, setSavingStatus] = useState({});

  const handleInputChange = (altId, critId, value) => {
    setLocalEdits((prev) => ({ ...prev, [`${altId}_${critId}`]: value }));
  };

  const handleSaveEvaluation = async (altId, critId) => {
    const key = `${altId}_${critId}`;
    const value = localEdits[key];
    if (value === undefined || value === '') return;
    setSavingStatus((prev) => ({ ...prev, [key]: 'saving' }));
    try {
      const response = await apiClient.post('/evaluations', {
        alternative_id: altId,
        criterion_id: critId,
        value,
      });
      setSavingStatus((prev) => ({ ...prev, [key]: 'saved' }));
      if (onEvaluationUpdated) onEvaluationUpdated(response.data);
      setTimeout(
        () => setSavingStatus((prev) => ({ ...prev, [key]: null })),
        2000,
      );
    } catch (error) {
      console.error(error);
      setSavingStatus((prev) => ({ ...prev, [key]: 'error' }));
    }
  };

  const getStatusColor = (status) => {
    if (status === 'saving') return 'border-orange-300 focus:ring-orange-200';
    if (status === 'saved')
      return 'border-green-300 focus:ring-green-200 bg-green-50';
    if (status === 'error')
      return 'border-red-300 focus:ring-red-200 bg-red-50';
    return 'border-gray-200 focus:ring-blue-100';
  };

  if (!alternatives.length && !criteria.length) {
    return (
      <div className="text-center py-8 text-gray-500 border rounded-xl bg-gray-50">
        Add data to begin.
      </div>
    );
  }

  // Small Action Buttons Component
  const ActionButtons = ({ onEdit, onDelete }) => (
    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 p-1 rounded shadow-sm border border-gray-100">
      <button
        onClick={onEdit}
        className="text-blue-500 hover:text-blue-700 p-0.5"
        title="Edit"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
      </button>
      <button
        onClick={onDelete}
        className="text-red-500 hover:text-red-700 p-0.5"
        title="Delete"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Expertise Aggregation & Math Panel */}
      <ExpertiseMathPanel
        projectId={projectId}
        onSuccess={onAggregationSuccess}
      />

      {/* Matrix Table */}
      <div className="overflow-x-auto pb-4">
        <table className="w-full text-sm border-separate border-spacing-0 border border-gray-200 rounded-xl shadow-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left font-semibold text-gray-900 border-b border-gray-200 rounded-tl-xl w-64 bg-gray-100">
                Criteria \ Alternatives
              </th>
              {alternatives.map((alt, index) => (
                <th
                  key={alt.id}
                  className={`group relative p-4 text-center font-semibold text-gray-900 border-b border-l border-gray-200 
                  ${index === alternatives.length - 1 ? 'rounded-tr-xl' : ''}`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>{alt.name}</span>
                    {alt.description && (
                      <span className="text-xs text-gray-500 font-normal line-clamp-1">
                        {alt.description}
                      </span>
                    )}
                  </div>
                  <ActionButtons
                    onEdit={() => onEditAlternative(alt)}
                    onDelete={() => onDeleteAlternative(alt.id)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {criteria.map((crit, critIndex) => (
              <tr key={crit.id} className="hover:bg-gray-50 transition-colors">
                <td
                  className={`group relative p-4 border-r border-gray-200 font-medium text-gray-700 w-64
                ${critIndex === criteria.length - 1 ? 'rounded-bl-xl' : ''}`}
                >
                  <div className="flex flex-col gap-1 pr-6">
                    <span className="text-gray-950 font-semibold">
                      {crit.name}
                    </span>
                    <span
                      className={`text-xs font-mono uppercase px-2 py-0.5 rounded ${crit.type === 'maximize' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} self-start`}
                    >
                      {crit.type}
                    </span>
                    {crit.description && (
                      <span className="text-xs text-gray-500 font-normal mt-1">
                        {crit.description}
                      </span>
                    )}
                  </div>
                  <ActionButtons
                    onEdit={() => onEditCriterion(crit)}
                    onDelete={() => onDeleteCriterion(crit.id)}
                  />
                </td>

                {alternatives.map((alt, altIndex) => {
                  const key = `${alt.id}_${crit.id}`;
                  const value =
                    localEdits[key] !== undefined
                      ? localEdits[key]
                      : originalValues[key] || '';
                  const status = savingStatus[key];

                  return (
                    <td
                      key={key}
                      className={`p-2 border-l border-gray-200
                    ${critIndex === criteria.length - 1 && altIndex === alternatives.length - 1 ? 'rounded-br-xl' : ''}`}
                    >
                      <div className="relative">
                        <input
                          type="number"
                          value={value}
                          onChange={(e) =>
                            handleInputChange(alt.id, crit.id, e.target.value)
                          }
                          onBlur={() => handleSaveEvaluation(alt.id, crit.id)}
                          className={`w-full p-2.5 text-center text-base rounded-lg border transition-all focus:outline-none focus:ring-2 disabled:opacity-50 ${getStatusColor(status)}`}
                          disabled={status === 'saving'}
                        />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MatrixTable;
