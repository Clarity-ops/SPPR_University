import db from '../config/db.js';

export const findAll = async (userId) => {
  const [rows] = await db.query('SELECT * FROM projects WHERE user_id = ?', [
    userId,
  ]);
  return rows;
};

export const findById = async (id, userId) => {
  const [rows] = await db.query(
    'SELECT * FROM projects WHERE id = ? AND user_id = ?',
    [id, userId],
  );
  return rows[0];
};

export const create = async (projectData) => {
  const { name, description, user_id } = projectData;
  const [result] = await db.query(
    'INSERT INTO projects (name, description, user_id) VALUES (?, ?, ?)',
    [name, description, user_id],
  );

  const [rows] = await db.query('SELECT * FROM projects WHERE id = ?', [
    result.insertId,
  ]);
  return rows[0];
};

export const update = async (id, userId, data) => {
  const { name, description } = data;
  await db.query(
    'UPDATE projects SET name = ?, description = ? WHERE id = ? AND user_id = ?',
    [name, description, id, userId],
  );
  return await findById(id, userId);
};

export const remove = async (id, userId) => {
  const [result] = await db.query(
    'DELETE FROM projects WHERE id = ? AND user_id = ?',
    [id, userId],
  );
  return result.affectedRows > 0;
};
