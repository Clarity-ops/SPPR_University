import * as criterionService from '../services/criterionService.js';

export const getCriteria = async (req, res) => {
  try {
    const { projectId } = req.params;
    const criteria = await criterionService.getCriteriaByProject(projectId);
    res.json(criteria);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createCriterion = async (req, res) => {
  try {
    const criterion = await criterionService.createCriterion(req.body);
    res.status(201).json(criterion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCriterion = async (req, res) => {
  try {
    const criterion = await criterionService.updateCriterion(
      req.params.id,
      req.body,
    );
    res.json(criterion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCriterion = async (req, res) => {
  try {
    const success = await criterionService.deleteCriterion(req.params.id);
    if (success) res.status(204).send();
    else res.status(404).json({ error: 'Criterion not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
