import db from '../config/db.js';

export const findExpertsByProjectId = async (projectId) => {
  const [rows] = await db.query('SELECT * FROM experts WHERE project_id = ?', [
    projectId,
  ]);
  return rows;
};

export const findByNameAndProject = async (projectId, name) => {
  const [rows] = await db.query(
    'SELECT * FROM experts WHERE project_id = ? AND name = ?',
    [projectId, name],
  );
  return rows[0];
};

export const createExpert = async (projectId, name, description = null) => {
  const [result] = await db.query(
    'INSERT INTO experts (project_id, name, description) VALUES (?, ?, ?)',
    [projectId, name, description],
  );

  const [rows] = await db.query('SELECT * FROM experts WHERE id = ?', [
    result.insertId,
  ]);
  return rows[0];
};

export const createExpertEvaluations = async (expertId, evaluations) => {
  if (!evaluations || evaluations.length === 0) return 0;

  const values = evaluations.map((evalItem) => [
    expertId,
    evalItem.alternativeId,
    evalItem.criterionId,
    evalItem.value,
  ]);

  const [result] = await db.query(
    'INSERT INTO expert_evaluations (expert_id, alternative_id, criterion_id, value) VALUES ?',
    [values],
  );

  return result.affectedRows;
};

export const getEvaluationsByExpertId = async (expertId) => {
  const [rows] = await db.query(
    'SELECT * FROM expert_evaluations WHERE expert_id = ?',
    [expertId],
  );
  return rows;
};

export const getEvaluationsByExpertIds = async (expertIds) => {
  if (!expertIds || expertIds.length === 0) return [];
  const [rows] = await db.query(
    'SELECT * FROM expert_evaluations WHERE expert_id IN (?)',
    [expertIds],
  );
  return rows;
};

export const getWeightVotesByProjectId = async (projectId) => {
  const [rows] = await db.query(
    `SELECT ewv.expert_id, ewv.criterion_id, ewv.vote_value 
     FROM expert_weight_votes ewv
     JOIN experts e ON ewv.expert_id = e.id
     WHERE e.project_id = ?`,
    [projectId],
  );
  return rows;
};

export const updateExpert = async (id, data) => {
  const { name, description } = data;
  await db.query('UPDATE experts SET name = ?, description = ? WHERE id = ?', [
    name,
    description,
    id,
  ]);
  const [rows] = await db.query('SELECT * FROM experts WHERE id = ?', [id]);
  return rows[0];
};

export const removeExpert = async (id) => {
  const [result] = await db.query('DELETE FROM experts WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

export const clearExpertData = async (expertId) => {
  await db.query('DELETE FROM expert_evaluations WHERE expert_id = ?', [
    expertId,
  ]);
  await db.query('DELETE FROM expert_weight_votes WHERE expert_id = ?', [
    expertId,
  ]);
};

export const clearExpertEvaluations = async (expertId) => {
  await db.query('DELETE FROM expert_evaluations WHERE expert_id = ?', [
    expertId,
  ]);
};

export const clearExpertWeightVotes = async (expertId) => {
  await db.query('DELETE FROM expert_weight_votes WHERE expert_id = ?', [
    expertId,
  ]);
};

export const createExpertWeightVotes = async (expertId, votes) => {
  if (!votes || votes.length === 0) return 0;
  // vote_value тут представляє "ранг" (1, 2, 3...)
  const values = votes.map((v) => [expertId, v.criterionId, v.rank]);

  const [result] = await db.query(
    'INSERT INTO expert_weight_votes (expert_id, criterion_id, vote_value) VALUES ?',
    [values],
  );
  return result.affectedRows;
};

export const getWeightVotesByExpertId = async (expertId) => {
  const [rows] = await db.query(
    'SELECT * FROM expert_weight_votes WHERE expert_id = ?',
    [expertId],
  );
  return rows;
};
