import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

export const useDSSWorkspace = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectData, setProjectData] = useState({
    project: null,
    alternatives: [],
    criteria: [],
    evaluations: [],
  });

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async () => {
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
  }, [selectedProjectId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const fetchProjectDetails = useCallback(async (id) => {
    if (!id) return;
    setLoadingData(true);
    try {
      const [altRes, critRes, evalRes] = await Promise.all([
        apiClient.get(`/alternatives/project/${id}`),
        apiClient.get(`/criteria/project/${id}`),
        apiClient.get(`/evaluations/project/${id}`),
      ]);

      setProjectData((prev) => ({
        ...prev,
        alternatives: altRes.data,
        criteria: critRes.data,
        evaluations: evalRes.data,
      }));
    } catch (err) {
      console.error(err);
      setError('Failed to load project matrix data.');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      const projectInfo = projects.find((p) => p.id === selectedProjectId);
      setProjectData((prev) => ({ ...prev, project: projectInfo }));
      fetchProjectDetails(selectedProjectId);
    }
  }, [selectedProjectId, projects, fetchProjectDetails]);

  return {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    projectData,
    loadingProjects,
    loadingData,
    error,
    clearError: () => setError(null),
    refreshProjects: fetchProjects,
    refreshMatrix: () => fetchProjectDetails(selectedProjectId),
  };
};
