import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useDSSWorkspace } from '../hooks/useDSSWorkspace';

/**
 * Profile Modal for creating an expert manually
 */
const ProfileModal = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit({ name, description });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md animate-in slide-in-from-bottom-4 duration-300">
        <h3 className="text-xl font-bold mb-4">Add Expert Profile</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={isSubmitting || !name}
          >
            {isSubmitting ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Expert Evaluation Modal (Step 1: Matrix, Step 2: Criteria Rank)
 */
const ExpertEvaluationModal = ({ expert, alternatives, criteria, onClose }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Matrix Data
  const [matrixEvals, setMatrixEvals] = useState([]);

  // Initialize Criteria Ranking Data
  const [rankVotes, setRankVotes] = useState([]);

  useEffect(() => {
    if (expert) {
      fetchExpertData();
    }
  }, [expert]);

  const fetchExpertData = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/experts/${expert.id}/data`);
      const { evaluations, weightVotes } = res.data;

      // Initialize matrix with fetched data or defaults
      const defaultEvals = [];
      (alternatives || []).forEach((alt) => {
        (criteria || []).forEach((crit) => {
          const existing = evaluations.find(
            (e) => e.alternativeId === alt.id && e.criterionId === crit.id,
          );
          defaultEvals.push({
            alternativeId: alt.id,
            criterionId: crit.id,
            value: existing ? existing.value : 0,
          });
        });
      });
      setMatrixEvals(defaultEvals);

      // Initialize ranking with fetched data or defaults
      const defaultRanks = (criteria || []).map((crit) => {
        const existing = weightVotes.find((v) => v.criterionId === crit.id);
        return {
          criterionId: crit.id,
          rank: existing ? existing.rank : 1,
        };
      });
      setRankVotes(defaultRanks);
    } catch (error) {
      console.error('Failed to fetch expert data:', error);
      // Fall back to defaults if fetch fails
      const defaultEvals = [];
      (alternatives || []).forEach((alt) => {
        (criteria || []).forEach((crit) => {
          defaultEvals.push({
            alternativeId: alt.id,
            criterionId: crit.id,
            value: 0,
          });
        });
      });
      setMatrixEvals(defaultEvals);

      const defaultRanks = (criteria || []).map((crit) => ({
        criterionId: crit.id,
        rank: 1,
      }));
      setRankVotes(defaultRanks);
    } finally {
      setIsLoading(false);
    }
  };

  if (!expert) return null;

  const handleMatrixChange = (altId, critId, val) => {
    // Preserve empty string to allow clearing the input field
    const newValue = val === '' ? '' : Number(val);
    setMatrixEvals((prev) =>
      prev.map((item) =>
        item.alternativeId === altId && item.criterionId === critId
          ? { ...item, value: newValue }
          : item,
      ),
    );
  };

  const handleRankChange = (critId, val) => {
    const newRank = val === '' ? '' : Number(val);
    setRankVotes((prev) =>
      prev.map((item) =>
        item.criterionId === critId ? { ...item, rank: newRank } : item,
      ),
    );
  };

  const handleSaveData = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        evaluations: matrixEvals,
        weightVotes: rankVotes,
      };
      await apiClient.post(`/experts/${expert.id}/data`, payload);
      onClose();
    } catch (error) {
      console.error('Failed to save evaluations:', error);
      alert('Error saving evaluation data');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl animate-in fade-in zoom-in-95 duration-300">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-600">Loading expert data...</p>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold mb-4">
              Evaluating as:{' '}
              <span className="text-blue-600">{expert.name}</span>
            </h3>

            {step === 1 && (
              <div className="animate-in fade-in duration-300">
                <h4 className="text-lg font-semibold mb-3">
                  Step 1: Matrix Evaluation
                </h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 border-b">
                          Alternatives \ Criteria
                        </th>
                        {(criteria || []).map((crit) => (
                          <th key={crit.id} className="px-4 py-3 border-b">
                            {crit.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(alternatives || []).map((alt) => (
                        <tr key={alt.id}>
                          <td className="px-4 py-3 font-medium">{alt.name}</td>
                          {(criteria || []).map((crit) => {
                            const cell = matrixEvals.find(
                              (m) =>
                                m.alternativeId === alt.id &&
                                m.criterionId === crit.id,
                            );
                            return (
                              <td key={crit.id} className="px-4 py-3">
                                <input
                                  type="number"
                                  className="w-full border border-gray-300 rounded px-2 py-1"
                                  value={cell?.value ?? ''}
                                  onChange={(e) =>
                                    handleMatrixChange(
                                      alt.id,
                                      crit.id,
                                      e.target.value,
                                    )
                                  }
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    onClick={() => setStep(2)}
                  >
                    Next: Rank Criteria
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h4 className="text-lg font-semibold mb-3">
                  Step 2: Criteria Ranking
                </h4>
                <p className="text-sm text-gray-500 mb-4">
                  Rank the criteria (e.g., 1st place, 2nd place).
                </p>
                <div className="space-y-3">
                  {(criteria || []).map((crit) => {
                    const vote = rankVotes.find(
                      (v) => v.criterionId === crit.id,
                    );
                    return (
                      <div
                        key={crit.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      >
                        <span className="font-medium">{crit.name}</span>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">Rank:</label>
                          <input
                            type="number"
                            className="w-20 border border-gray-300 rounded px-2 py-1"
                            value={vote?.rank ?? ''}
                            onChange={(e) =>
                              handleRankChange(crit.id, e.target.value)
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 flex justify-between">
                  <button
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    onClick={() => setStep(1)}
                    disabled={isSubmitting}
                  >
                    Back
                  </button>
                  <div className="flex gap-3">
                    <button
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleSaveData}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Data'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default function ExpertiseView() {
  const { selectedProjectId, projectData } = useDSSWorkspace();
  const projectId = selectedProjectId;
  const { alternatives, criteria } = projectData || {};

  const [experts, setExperts] = useState([]);
  const [isImportingEvals, setIsImportingEvals] = useState(false);
  const [isImportingVotes, setIsImportingVotes] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedExpertToEvaluate, setSelectedExpertToEvaluate] =
    useState(null);

  useEffect(() => {
    fetchExperts();
  }, [projectId]);

  const fetchExperts = async () => {
    if (!projectId) return;
    try {
      // Виправлено: прибрано зайвий префікс /api/
      const res = await apiClient.get(`/experts/project/${projectId}`);
      setExperts(res.data);
    } catch (error) {
      console.error('Failed to fetch experts:', error);
      setExperts([]);
    }
  };

  const handleCreateExpert = async (data) => {
    if (!projectId) return;
    try {
      // Виправлено: правильний маршрут бекенду для створення експерта
      await apiClient.post(`/experts/project/${projectId}`, data);
      fetchExperts();
    } catch (error) {
      console.error('Failed to create expert', error);
      alert('Failed to create expert');
    }
  };

  const handleFileUpload = async (event, endpoint, setLoadingState) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoadingState(true);
    try {
      await apiClient.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Import successful!');
      fetchExperts();
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please try again.');
    } finally {
      setLoadingState(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleDeleteExpert = async (expertId) => {
    if (!window.confirm('Are you sure you want to delete this expert?')) {
      return;
    }
    try {
      await apiClient.delete(`/experts/${expertId}`);
      alert('Expert deleted successfully!');
      fetchExperts();
    } catch (error) {
      console.error('Failed to delete expert:', error);
      alert('Failed to delete expert');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Section: Data Import & Creation */}
      <div className="bg-white border border-gray-100 p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Expertise Management
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage experts and import their evaluation data
            </p>
          </div>
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + Add Expert Manually
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dropzone 1: Import Matrix Evaluations */}
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              isImportingEvals
                ? 'border-gray-300 bg-gray-50 opacity-60'
                : 'border-blue-200 hover:bg-blue-50 cursor-pointer text-blue-600'
            }`}
          >
            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
              <span className="font-medium">
                {isImportingEvals
                  ? 'Importing Matrix Data...'
                  : 'Import Matrix Evaluations (CSV)'}
              </span>
              <input
                type="file"
                className="hidden"
                accept=".csv"
                disabled={isImportingEvals}
                onChange={(e) =>
                  handleFileUpload(
                    e,
                    `/experts/project/${projectId}/import`,
                    setIsImportingEvals,
                  )
                }
              />
            </label>
          </div>

          {/* Dropzone 2: Import Criteria Ranks */}
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              isImportingVotes
                ? 'border-gray-300 bg-gray-50 opacity-60'
                : 'border-green-200 hover:bg-green-50 cursor-pointer text-green-600'
            }`}
          >
            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
              <span className="font-medium">
                {isImportingVotes
                  ? 'Importing Ranks...'
                  : 'Import Criteria Ranks (CSV)'}
              </span>
              <input
                type="file"
                className="hidden"
                accept=".csv"
                disabled={isImportingVotes}
                onChange={(e) =>
                  handleFileUpload(
                    e,
                    `/experts/project/${projectId}/import-votes`,
                    setIsImportingVotes,
                  )
                }
              />
            </label>
          </div>
        </div>
      </div>

      {/* Experts Table Section */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Current Experts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                  ID
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                  Name
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                  Description
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {experts.map((expert) => (
                <tr
                  key={expert.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-gray-600">
                    #{expert.id}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {expert.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-[200px]">
                    {expert.description}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-3">
                      <button
                        className="text-green-600 font-semibold hover:underline"
                        onClick={() => setSelectedExpertToEvaluate(expert)}
                      >
                        Evaluate
                      </button>
                      <button
                        className="text-red-600 font-semibold hover:underline"
                        onClick={() => handleDeleteExpert(expert.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {experts.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No experts found. Add them manually or import via CSV.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onSubmit={handleCreateExpert}
      />

      {selectedExpertToEvaluate && (
        <ExpertEvaluationModal
          expert={selectedExpertToEvaluate}
          alternatives={alternatives}
          criteria={criteria}
          onClose={() => setSelectedExpertToEvaluate(null)}
        />
      )}
    </div>
  );
}
