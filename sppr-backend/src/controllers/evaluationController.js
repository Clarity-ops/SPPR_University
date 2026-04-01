import * as evaluationService from '../services/evaluationService.js';

export const getEvaluations = async (req, res) => {
  try {
    const { projectId } = req.params;
    const evaluations =
      await evaluationService.getProjectEvaluations(projectId);
    res.json(evaluations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const saveEvaluation = async (req, res) => {
  try {
    const evaluation = await evaluationService.saveEvaluation(req.body);
    res.status(200).json(evaluation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
