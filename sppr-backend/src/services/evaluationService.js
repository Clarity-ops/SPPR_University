import * as evaluationRepository from '../repositories/evaluationRepository.js';

export const getProjectEvaluations = async (projectId) => {
  return await evaluationRepository.findByProject(projectId);
};

export const saveEvaluation = async (data) => {
  return await evaluationRepository.save(data);
};
