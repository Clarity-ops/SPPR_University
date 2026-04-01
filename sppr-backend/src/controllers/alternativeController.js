import * as alternativeService from '../services/alternativeService.js';

export const getAlternatives = async (req, res) => {
  try {
    const { projectId } = req.params;
    const alternatives =
      await alternativeService.getAlternativesByProject(projectId);
    res.json(alternatives);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createAlternative = async (req, res) => {
  try {
    const alternative = await alternativeService.createAlternative(req.body);
    res.status(201).json(alternative);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAlternative = async (req, res) => {
  try {
    const alternative = await alternativeService.updateAlternative(
      req.params.id,
      req.body,
    );
    res.json(alternative);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAlternative = async (req, res) => {
  try {
    const success = await alternativeService.deleteAlternative(req.params.id);
    if (success) res.status(204).send();
    else res.status(404).json({ error: 'Alternative not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
