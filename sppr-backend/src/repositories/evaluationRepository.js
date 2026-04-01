import db from '../config/db.js';

export const findByProject = async (projectId) => {
  const [rows] = await db.query(
    `SELECT e.* FROM evaluations e 
     JOIN alternatives a ON e.alternative_id = a.id 
     WHERE a.project_id = ?`,
    [projectId],
  );
  return rows;
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
