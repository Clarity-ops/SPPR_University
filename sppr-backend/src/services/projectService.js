import * as projectRepository from '../repositories/projectRepository.js';

export const getProjects = async (userId) => {
  return await projectRepository.findAll(userId);
};

export const getProjectById = async (id, userId) => {
  return await projectRepository.findById(id, userId);
};

export const createProject = async (data, userId) => {
  const newProject = { ...data, user_id: userId };
  const insertId = await projectRepository.create(newProject);
  return await projectRepository.findById(insertId, userId);
};

export const updateProject = async (id, userId, data) => {
  return await projectRepository.update(id, userId, data);
};

export const removeProject = async (id, userId) => {
  return await projectRepository.remove(id, userId);
};
