/* eslint-disable no-unused-vars */
import * as expertLogicRepository from '../repositories/expertLogicRepository.js';
import * as evaluationRepository from '../repositories/evaluationRepository.js';

/**
 * Parses operator string and returns boolean result
 */
const evaluateCondition = (actualValue, operator, targetValue) => {
  switch (operator) {
    case '>':
      return actualValue > targetValue;
    case '<':
      return actualValue < targetValue;
    case '>=':
      return actualValue >= targetValue;
    case '<=':
      return actualValue <= targetValue;
    case '==':
      return actualValue === targetValue;
    default:
      return false;
  }
};

/**
 * Core function that applies Thresholds and IF-THEN Rules.
 * Returns an object with the "surviving" alternatives and their adjusted evaluations.
 */
export const applyLogicToMatrix = async (projectId) => {
  // 1. Отримуємо всі оцінки проекту
  const evaluations = await evaluationRepository.findByProject(projectId);

  const thresholds =
    await expertLogicRepository.getThresholdsByProjectId(projectId);
  const rules = await expertLogicRepository.getRulesByProjectId(projectId);

  // Групуємо оцінки по альтернативах
  const altMap = new Map();
  evaluations.forEach((row) => {
    if (!altMap.has(row.alternative_id)) {
      altMap.set(row.alternative_id, {
        id: row.alternative_id,
        name: row.alternative_name,
        isExcluded: false,
        evals: {},
      });
    }
    altMap.get(row.alternative_id).evals[row.criterion_id] = row.value;
  });

  const analysisLog = []; // Для пояснення рішень на фронтенді

  for (const [altId, altData] of altMap.entries()) {
    // --- STEP A: ПОРОГОВА ОБРОБКА (Thresholds) ---
    for (const threshold of thresholds) {
      const val = altData.evals[threshold.criterion_id];
      if (val === undefined) continue;

      if (threshold.min_value !== null && val < threshold.min_value) {
        altData.isExcluded = true;
        analysisLog.push(
          `[Threshold] ${altData.name} excluded: Value ${val} is below minimum ${threshold.min_value}`,
        );
        break; // Немає сенсу перевіряти далі
      }
      if (threshold.max_value !== null && val > threshold.max_value) {
        altData.isExcluded = true;
        analysisLog.push(
          `[Threshold] ${altData.name} excluded: Value ${val} exceeds maximum ${threshold.max_value}`,
        );
        break;
      }
    }

    if (altData.isExcluded) continue;

    // --- STEP B: ЕКСПЕРТНА ЛОГІКА (IF-THEN Rules) ---
    for (const rule of rules) {
      const condition =
        typeof rule.condition_json === 'string'
          ? JSON.parse(rule.condition_json)
          : rule.condition_json;
      const action =
        typeof rule.action_json === 'string'
          ? JSON.parse(rule.action_json)
          : rule.action_json;

      const val = altData.evals[condition.criterionId];
      if (val === undefined) continue;

      const isConditionMet = evaluateCondition(
        val,
        condition.operator,
        condition.value,
      );

      if (isConditionMet) {
        if (action.type === 'exclude') {
          altData.isExcluded = true;
          analysisLog.push(
            `[Rule applied] ${altData.name} excluded due to rule: ${rule.rule_name}`,
          );
          break;
        } else if (action.type === 'penalty') {
          // Наприклад, impact: 0.2 означає штраф 20%
          const penaltyAmount = val * action.impact;
          altData.evals[condition.criterionId] = Number(
            Number(val) - penaltyAmount,
          ).toFixed(4);
          analysisLog.push(
            `[Rule applied] ${altData.name} penalized by ${action.impact * 100}% on criterion ${condition.criterionId} due to: ${rule.rule_name}`,
          );
        } else if (action.type === 'bonus') {
          const bonusAmount = val * action.impact;
          altData.evals[condition.criterionId] = Number(
            Number(val) + bonusAmount,
          ).toFixed(4);
          analysisLog.push(
            `[Rule applied] ${altData.name} got bonus of ${action.impact * 100}% on criterion ${condition.criterionId} due to: ${rule.rule_name}`,
          );
        }
      }
    }
  }

  // Формуємо фінальні результати
  const eligibleAlternatives = [];
  const adjustedEvaluations = [];

  for (const altData of altMap.values()) {
    if (!altData.isExcluded) {
      eligibleAlternatives.push({ id: altData.id, name: altData.name });
      for (const [critId, val] of Object.entries(altData.evals)) {
        adjustedEvaluations.push({
          alternativeId: altData.id,
          criterionId: Number(critId),
          value: val,
        });
      }
    }
  }

  return {
    eligibleAlternatives,
    adjustedEvaluations,
    analysisLog,
  };
};
