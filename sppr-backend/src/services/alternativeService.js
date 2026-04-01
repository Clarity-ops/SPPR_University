import * as alternativeRepository from '../repositories/alternativeRepository.js';

export const getAlternativesByProject = async (projectId) => {
  return await alternativeRepository.findByProjectId(projectId);
};

export const createAlternative = async (data) => {
  return await alternativeRepository.create(data);
};

export const updateAlternative = async (id, data) => {
  return await alternativeRepository.update(id, data);
};

export const deleteAlternative = async (id) => {
  return await alternativeRepository.remove(id);
};
