import * as criterionRepository from '../repositories/criterionRepository.js';

export const getCriteriaByProject = async (projectId) => {
  return await criterionRepository.findByProjectId(projectId);
};

export const createCriterion = async (data) => {
  return await criterionRepository.create(data);
};

export const updateCriterion = async (id, data) => {
  return await criterionRepository.update(id, data);
};

export const deleteCriterion = async (id) => {
  return await criterionRepository.remove(id);
};
