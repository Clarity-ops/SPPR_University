import db from '../config/db.js';

// --- THRESHOLDS ---

export const getThresholdsByProjectId = async (projectId) => {
  const [rows] = await db.query(
    'SELECT * FROM criteria_thresholds WHERE project_id = ? AND is_active = TRUE',
    [projectId],
  );
  return rows;
};

export const upsertThreshold = async (
  projectId,
  criterionId,
  minVal,
  maxVal,
) => {
  // Використовуємо INSERT ... ON DUPLICATE KEY UPDATE для зручності
  const [result] = await db.query(
    `INSERT INTO criteria_thresholds (project_id, criterion_id, min_value, max_value, is_active) 
     VALUES (?, ?, ?, ?, TRUE)
     ON DUPLICATE KEY UPDATE min_value = VALUES(min_value), max_value = VALUES(max_value), is_active = TRUE`,
    [projectId, criterionId, minVal, maxVal],
  );
  return result;
};

export const deleteThreshold = async (thresholdId) => {
  const [result] = await db.query(
    'UPDATE criteria_thresholds SET is_active = FALSE WHERE id = ?',
    [thresholdId],
  );
  return result.affectedRows > 0;
};

// --- RULES (IF-THEN) ---

export const getRulesByProjectId = async (projectId) => {
  const [rows] = await db.query(
    'SELECT * FROM expert_rules WHERE project_id = ?',
    [projectId],
  );
  return rows;
};

export const createRule = async (
  projectId,
  name,
  conditionJson,
  actionJson,
  description,
) => {
  const [result] = await db.query(
    'INSERT INTO expert_rules (project_id, rule_name, condition_json, action_json, description) VALUES (?, ?, ?, ?, ?)',
    [
      projectId,
      name,
      JSON.stringify(conditionJson),
      JSON.stringify(actionJson),
      description,
    ],
  );
  return result.insertId;
};

export const deleteRule = async (ruleId) => {
  const [result] = await db.query('DELETE FROM expert_rules WHERE id = ?', [
    ruleId,
  ]);
  return result.affectedRows > 0;
};
