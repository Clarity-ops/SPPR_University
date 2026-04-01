import db from '../config/db.js';

export const findByProjectId = async (projectId) => {
  const [rows] = await db.query('SELECT * FROM criteria WHERE project_id = ?', [
    projectId,
  ]);
  return rows;
};

export const create = async (data) => {
  const { project_id, name, type, description, weight } = data;
  const [result] = await db.query(
    'INSERT INTO criteria (project_id, name, type, description, weight) VALUES (?, ?, ?, ?, ?)',
    [project_id, name, type, description, weight],
  );

  const [rows] = await db.query('SELECT * FROM criteria WHERE id = ?', [
    result.insertId,
  ]);
  return rows[0];
};

export const update = async (id, data) => {
  const { name, type, description, weight } = data;
  await db.query(
    'UPDATE criteria SET name = ?, type = ?, description = ?, weight = ? WHERE id = ?',
    [name, type, description, weight, id],
  );
  const [rows] = await db.query('SELECT * FROM criteria WHERE id = ?', [id]);
  return rows[0];
};

export const remove = async (id) => {
  const [result] = await db.query('DELETE FROM criteria WHERE id = ?', [id]);
  return result.affectedRows > 0;
};
