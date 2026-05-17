import * as expertLogicRepository from '../repositories/expertLogicRepository.js';

// --- THRESHOLDS ---

export const getProjectThresholds = async (req, res) => {
  try {
    const { projectId } = req.params;
    const thresholds =
      await expertLogicRepository.getThresholdsByProjectId(projectId);
    res.status(200).json(thresholds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const saveThreshold = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { criterionId, minValue, maxValue } = req.body;

    if (!criterionId) {
      return res.status(400).json({ error: 'criterionId is required' });
    }

    // Pass null if value is not provided, allowing open-ended thresholds
    const minVal = minValue !== undefined ? minValue : null;
    const maxVal = maxValue !== undefined ? maxValue : null;

    await expertLogicRepository.upsertThreshold(
      projectId,
      criterionId,
      minVal,
      maxVal,
    );

    res.status(200).json({ message: 'Threshold saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteThreshold = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await expertLogicRepository.deleteThreshold(id);

    if (!success) {
      return res.status(404).json({ error: 'Threshold not found' });
    }
    res.status(200).json({ message: 'Threshold deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- RULES (IF-THEN) ---

export const getProjectRules = async (req, res) => {
  try {
    const { projectId } = req.params;
    const rules = await expertLogicRepository.getRulesByProjectId(projectId);

    // Parse JSON strings back to objects for the frontend
    const formattedRules = rules.map((rule) => ({
      ...rule,
      condition_json:
        typeof rule.condition_json === 'string'
          ? JSON.parse(rule.condition_json)
          : rule.condition_json,
      action_json:
        typeof rule.action_json === 'string'
          ? JSON.parse(rule.action_json)
          : rule.action_json,
    }));

    res.status(200).json(formattedRules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createRule = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { ruleName, conditionJson, actionJson, description } = req.body;

    if (!ruleName || !conditionJson || !actionJson) {
      return res.status(400).json({
        error: 'ruleName, conditionJson, and actionJson are required',
      });
    }

    const insertId = await expertLogicRepository.createRule(
      projectId,
      ruleName,
      conditionJson,
      actionJson,
      description || '',
    );

    res
      .status(201)
      .json({ message: 'Rule created successfully', id: insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteRule = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await expertLogicRepository.deleteRule(id);

    if (!success) {
      return res.status(404).json({ error: 'Rule not found' });
    }
    res.status(200).json({ message: 'Rule deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
