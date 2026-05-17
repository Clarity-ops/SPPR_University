import { useState, useEffect, useCallback } from 'react';
import apiClient from './api/client';
import Layout from './components/Layout';
import MatrixTable from './components/MatrixTable';
import EntityModal from './components/EntityModal';
import ResultsView from './components/ResultsView';
import ExpertiseView from './components/ExpertiseView';
import RulesView from './components/RulesView';

const App = () => {
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectData, setProjectData] = useState({
    project: null,
    alternatives: [],
    criteria: [],
    evaluations: [],
  });
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('matrix');
  const [resultsRefreshToken, setResultsRefreshToken] = useState(0);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'alternative',
    mode: 'add',
    data: null,
  });

  const fetchProjects = async () => {
    try {
      const response = await apiClient.get('/projects');
      setProjects(response.data);
      if (response.data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(response.data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load projects list.');
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProjectDetails = useCallback(
    async (id) => {
      if (!id) return;
      setLoadingData(true);
      try {
        // Using the exact paths from your original code
        const [altRes, critRes, evalRes] = await Promise.all([
          apiClient.get(`/alternatives/project/${id}`),
          apiClient.get(`/criteria/project/${id}`),
          apiClient.get(`/evaluations/project/${id}`),
        ]);
        const selectedProject = projects.find((p) => p.id === id);
        setProjectData({
          project: selectedProject,
          alternatives: altRes.data,
          criteria: critRes.data,
          evaluations: evalRes.data,
        });
      } catch (err) {
        console.error(err);
        setError('Failed to load project matrix data.');
      } finally {
        setLoadingData(false);
      }
    },
    [projects],
  );

  useEffect(() => {
    fetchProjectDetails(selectedProjectId);
  }, [selectedProjectId, fetchProjectDetails]);

  const openModal = (type, mode, data = null) =>
    setModalConfig({ isOpen: true, type, mode, data });
  const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'results') {
      setResultsRefreshToken((prev) => prev + 1);
    }
  };

  const handleSaveEntity = async (formData) => {
    const { type, mode, data } = modalConfig;
    const normalizedType = type === 'criterion' ? 'criteria' : type;

    const endpointByType = {
      project: '/projects',
      alternative: '/alternatives',
      criteria: '/criteria',
    };

    const payloadByType = {
      project: { name: formData.name, description: formData.description },
      alternative:
        mode === 'add'
          ? {
              project_id: selectedProjectId,
              name: formData.name,
              description: formData.description,
            }
          : {
              name: formData.name,
              description: formData.description,
            },
      criteria:
        mode === 'add'
          ? {
              project_id: selectedProjectId,
              name: formData.name,
              description: formData.description,
              type: formData.type,
              weight: Number(formData.weight),
            }
          : {
              name: formData.name,
              description: formData.description,
              type: formData.type,
              weight: Number(formData.weight),
            },
    };

    const endpoint = endpointByType[normalizedType];
    const payload = payloadByType[normalizedType];

    if (!endpoint || !payload) {
      alert(`Unsupported entity type: ${type}`);
      return;
    }

    if (normalizedType === 'criteria' && Number.isNaN(payload.weight)) {
      alert('Weight must be a valid number.');
      return;
    }

    try {
      if (mode === 'add') {
        const res = await apiClient.post(endpoint, payload);
        if (normalizedType === 'project') {
          await fetchProjects();
          setSelectedProjectId(res.data.id);
        }
      } else {
        await apiClient.put(`${endpoint}/${data.id}`, payload);
        if (normalizedType === 'project') await fetchProjects();
      }

      closeModal();
      if (normalizedType !== 'project' || mode !== 'add') {
        fetchProjectDetails(selectedProjectId);
      }
    } catch (err) {
      console.error(err);
      alert(
        `Failed to save ${normalizedType}. Check backend validation rules.`,
      );
    }
  };

  const handleDelete = async (type, id) => {
    const isProject = type === 'project';
    if (!window.confirm(`Are you sure you want to delete this ${type}?`))
      return;

    try {
      const endpointByType = {
        project: `/projects/${id}`,
        alternative: `/alternatives/${id}`,
        criteria: `/criteria/${id}`,
      };

      const endpoint = endpointByType[type];
      if (!endpoint) {
        alert(`Unsupported entity type: ${type}`);
        return;
      }

      await apiClient.delete(endpoint);

      if (isProject) {
        setSelectedProjectId(null);
        setActiveTab('matrix');
        await fetchProjects();
      } else {
        fetchProjectDetails(selectedProjectId);
      }
    } catch (err) {
      console.error(err);
      alert(`Failed to delete ${type}`);
    }
  };

  return (
    <Layout
      projects={projects}
      selectedProjectId={selectedProjectId}
      onSelectProject={setSelectedProjectId}
      onAddProject={() => openModal('project', 'add')}
      loading={loadingProjects}
    >
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border mb-6 flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold">
            &times;
          </button>
        </div>
      )}

      {selectedProjectId ? (
        loadingData ? (
          <div className="text-center py-16 text-gray-500">
            Loading matrix...
          </div>
        ) : (
          <div>
            <div className="mb-6 flex flex-col sm:flex-row sm:justify-between items-start sm:items-end gap-4 border-b border-gray-100 pb-6">
              <div className="flex-1 w-full flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                  <h1 className="text-3xl font-extrabold text-gray-950">
                    {projectData.project?.name}
                  </h1>
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        openModal('project', 'edit', projectData.project)
                      }
                      className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        handleDelete('project', projectData.project.id)
                      }
                      className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-gray-600">
                  {projectData.project?.description}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => openModal('criteria', 'add')}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  + Criterion
                </button>
                <button
                  onClick={() => openModal('alternative', 'add')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  + Alternative
                </button>
              </div>
            </div>
            <div className="sticky top-0 z-10 mb-6 border-b border-gray-100 overflow-x-auto bg-white">
              <div className="flex gap-2 min-w-max">
                <button
                  onClick={() => handleSelectTab('matrix')}
                  className={`px-4 py-2 rounded-t-lg text-sm font-medium border border-b-0 transition-colors ${
                    activeTab === 'matrix'
                      ? 'bg-white text-blue-700 border-gray-200'
                      : 'bg-gray-50 text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  Matrix
                </button>
                <button
                  onClick={() => handleSelectTab('results')}
                  className={`px-4 py-2 rounded-t-lg text-sm font-medium border border-b-0 transition-colors ${
                    activeTab === 'results'
                      ? 'bg-white text-blue-700 border-gray-200'
                      : 'bg-gray-50 text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  Results
                </button>
                <button
                  onClick={() => handleSelectTab('expertise')}
                  className={`px-4 py-2 rounded-t-lg text-sm font-medium border border-b-0 transition-colors ${
                    activeTab === 'expertise'
                      ? 'bg-white text-blue-700 border-gray-200'
                      : 'bg-gray-50 text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  Expertise
                </button>
                <button
                  onClick={() => handleSelectTab('rules')}
                  className={`px-4 py-2 rounded-t-lg text-sm font-medium border border-b-0 transition-colors ${
                    activeTab === 'rules'
                      ? 'bg-white text-blue-700 border-gray-200'
                      : 'bg-gray-50 text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  Rules
                </button>
              </div>
            </div>
            {activeTab === 'matrix' && (
              <MatrixTable
                projectId={selectedProjectId}
                alternatives={projectData.alternatives}
                criteria={projectData.criteria}
                evaluations={projectData.evaluations}
                onEvaluationUpdated={() =>
                  fetchProjectDetails(selectedProjectId)
                }
                onAggregationSuccess={() =>
                  fetchProjectDetails(selectedProjectId)
                }
                onEditAlternative={(alt) =>
                  openModal('alternative', 'edit', alt)
                }
                onDeleteAlternative={(id) => handleDelete('alternative', id)}
                onEditCriterion={(crit) => openModal('criteria', 'edit', crit)}
                onDeleteCriterion={(id) => handleDelete('criteria', id)}
              />
            )}
            {activeTab === 'results' && (
              <ResultsView
                projectId={selectedProjectId}
                refreshTrigger={resultsRefreshToken}
              />
            )}
            {activeTab === 'expertise' && (
              <ExpertiseView projectId={selectedProjectId} />
            )}
            {activeTab === 'rules' && (
              <RulesView
                projectId={selectedProjectId}
                criteria={projectData.criteria}
              />
            )}
          </div>
        )
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed">
          Select a project
        </div>
      )}

      <EntityModal
        key={
          modalConfig.isOpen
            ? `modal-open-${modalConfig.data?.id || 'new'}`
            : 'modal-closed'
        }
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onSave={handleSaveEntity}
        type={modalConfig.type}
        mode={modalConfig.mode}
        initialData={modalConfig.data}
      />
    </Layout>
  );
};

export default App;
