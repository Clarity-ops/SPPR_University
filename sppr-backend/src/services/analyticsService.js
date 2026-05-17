import { findByProjectId as findCriterionByProjectId } from '../repositories/criterionRepository.js';
import { applyLogicToMatrix } from './expertLogicService.js';

export const calculateRanking = async (projectId) => {
  // 1. Отримуємо критерії з їхніми типами та узгодженими вагами
  const criteria = await findCriterionByProjectId(projectId);

  if (!criteria.length) throw new Error('No criteria found for this project');

  // 2. Застосовуємо експертну логіку (Пороги та Правила IF-THEN)
  const logicResult = await applyLogicToMatrix(projectId);
  const { eligibleAlternatives, adjustedEvaluations, analysisLog } =
    logicResult;

  // Якщо всі альтернативи були відфільтровані
  if (!eligibleAlternatives.length) {
    return {
      rankings: [],
      bestAlternative: null,
      analysisLog: [
        ...analysisLog,
        'All alternatives were excluded by thresholds or rules.',
      ],
    };
  }

  // 3. Знаходимо min та max для кожного критерію (для правильної нормалізації)
  const critValues = {};
  criteria.forEach(
    (c) => (critValues[c.id] = { max: -Infinity, min: Infinity }),
  );

  adjustedEvaluations.forEach((evalRow) => {
    const cId = evalRow.criterionId;
    if (critValues[cId]) {
      const numValue = Number(evalRow.value);
      if (numValue > critValues[cId].max) critValues[cId].max = numValue;
      if (numValue < critValues[cId].min) critValues[cId].min = numValue;
    }
  });

  // 4. Нормалізуємо оцінки за мінімаксним алгоритмом
  const normalizedMatrix = {};
  eligibleAlternatives.forEach((alt) => (normalizedMatrix[alt.id] = {}));

  adjustedEvaluations.forEach((evalRow) => {
    const cId = evalRow.criterionId;
    const cType = criteria.find((c) => c.id === cId)?.type;
    const val = Number(evalRow.value);
    const { max, min } = critValues[cId];

    let normVal;
    if (max === min) {
      normVal = 1; // Якщо всі значення однакові
    } else {
      if (cType === 'maximize') {
        normVal = (val - min) / (max - min);
      } else {
        // minimize
        normVal = (max - val) / (max - min);
      }
    }
    normalizedMatrix[evalRow.alternativeId][cId] = normVal;
  });

  // 5. Обчислюємо інтегральні оцінки (Згортка)
  const results = eligibleAlternatives.map((alt) => {
    let additiveScore = 0;
    let multiplicativeScore = 1;
    let cautiousScore = Infinity;

    criteria.forEach((c) => {
      const w = Number(c.weight) || 0;
      const norm = normalizedMatrix[alt.id][c.id] || 0;

      // Адитивна згортка (SAW)
      additiveScore += norm * w;

      // Мультиплікативна згортка (WPM)
      // Використовуємо 0.0001 замість 0, щоб уникнути множення на 0 для найгірших значень
      const safeNorm = norm > 0 ? norm : 0.0001;
      multiplicativeScore *= Math.pow(safeNorm, w);

      // Обережна згортка (Мінімум) - визначається за найслабшим зваженим показником
      const weightedScore = norm * w;
      if (weightedScore < cautiousScore) {
        cautiousScore = weightedScore;
      }
    });

    return {
      id: alt.id,
      name: alt.name,
      additiveScore: Number(additiveScore.toFixed(4)),
      multiplicativeScore: Number(multiplicativeScore.toFixed(4)),
      cautiousScore: Number(cautiousScore.toFixed(4)),
    };
  });

  // 6. Ранжування (за замовчуванням за адитивною згорткою)
  results.sort((a, b) => b.additiveScore - a.additiveScore);

  return {
    rankings: results,
    bestAlternative: results.length > 0 ? results[0] : null,
    analysisLog,
  };
};
