import db from '../config/db.js';

export const findByProject = async (projectId) => {
  const [rows] = await db.query(
    `SELECT e.*, a.name as alternative_name 
     FROM evaluations e 
     JOIN alternatives a ON e.alternative_id = a.id 
     WHERE a.project_id = ?`,
    [projectId],
  );
  return rows;
};

export const saveMany = async (evaluationsMatrix) => {
  if (!evaluationsMatrix || evaluationsMatrix.length === 0) return 0;
  const [result] = await db.query(
    'INSERT INTO evaluations (alternative_id, criterion_id, value) VALUES ?',
    [evaluationsMatrix],
  );
  return result.affectedRows;
};

export const deleteByAlternativeIds = async (alternativeIds) => {
  if (!alternativeIds || alternativeIds.length === 0) return 0;
  const [result] = await db.query(
    'DELETE FROM evaluations WHERE alternative_id IN (?)',
    [alternativeIds],
  );
  return result.affectedRows;
};

export const save = async (data) => {
  const { alternative_id, criterion_id, value } = data;

  await db.query(
    `INSERT INTO evaluations (alternative_id, criterion_id, value) 
     VALUES (?, ?, ?) 
     ON DUPLICATE KEY UPDATE value = VALUES(value)`,
    [alternative_id, criterion_id, value],
  );

  const [rows] = await db.query(
    'SELECT * FROM evaluations WHERE alternative_id = ? AND criterion_id = ?',
    [alternative_id, criterion_id],
  );
  return rows[0];
};
