import db from '../config/db.js';

export const findByProjectId = async (projectId) => {
  const [rows] = await db.query(
    'SELECT * FROM alternatives WHERE project_id = ?',
    [projectId],
  );
  return rows;
};

export const create = async (alternativeData) => {
  const { project_id, name, description } = alternativeData;
  const [result] = await db.query(
    'INSERT INTO alternatives (project_id, name, description) VALUES (?, ?, ?)',
    [project_id, name, description],
  );

  const [rows] = await db.query('SELECT * FROM alternatives WHERE id = ?', [
    result.insertId,
  ]);
  return rows[0];
};

export const update = async (id, data) => {
  const { name, description } = data;
  await db.query(
    'UPDATE alternatives SET name = ?, description = ? WHERE id = ?',
    [name, description, id],
  );
  const [rows] = await db.query('SELECT * FROM alternatives WHERE id = ?', [
    id,
  ]);
  return rows[0];
};

export const remove = async (id) => {
  const [result] = await db.query('DELETE FROM alternatives WHERE id = ?', [
    id,
  ]);
  return result.affectedRows > 0;
};
