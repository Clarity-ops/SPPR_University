import * as projectService from '../services/projectService.js';

// Mock auth
const MOCK_USER_ID = 1;

export const getAllProjects = async (req, res) => {
  try {
    const projects = await projectService.getProjects(MOCK_USER_ID);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const project = await projectService.createProject(req.body, MOCK_USER_ID);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    // user_id = 1
    const project = await projectService.updateProject(
      req.params.id,
      MOCK_USER_ID,
      { name, description },
    );
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    // user_id = 1
    const success = await projectService.removeProject(
      req.params.id,
      MOCK_USER_ID,
    );
    if (success) res.status(204).send();
    else res.status(404).json({ error: 'Project not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
