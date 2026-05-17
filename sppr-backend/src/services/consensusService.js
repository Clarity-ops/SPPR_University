import * as expertRepository from '../repositories/expertRepository.js';
import * as alternativeRepository from '../repositories/alternativeRepository.js';
import * as evaluationRepository from '../repositories/evaluationRepository.js';
import {
  calculateArithmeticMean,
  calculateGeometricMean,
  calculateMedian,
} from '../utils/consensusMath.js';

export const calculateConsensus = async (projectId, method) => {
  const experts = await expertRepository.findExpertsByProjectId(projectId);
  if (!experts.length) {
    throw new Error('No experts found for this project');
  }

  const expertIds = experts.map((e) => e.id);

  const rawEvaluations =
    await expertRepository.getEvaluationsByExpertIds(expertIds);

  if (!rawEvaluations.length) {
    throw new Error('No evaluations found to build consensus');
  }

  const groupedMap = new Map();

  rawEvaluations.forEach((evalRow) => {
    const key = `${evalRow.alternative_id}_${evalRow.criterion_id}`;
    if (!groupedMap.has(key)) {
      groupedMap.set(key, []);
    }
    groupedMap.get(key).push(evalRow.value);
  });

  const finalMatrix = [];
  for (const [key, values] of groupedMap.entries()) {
    const [alternativeId, criterionId] = key.split('_').map(Number);
    let finalValue;

    switch (method) {
      case 'arithmetic':
        finalValue = calculateArithmeticMean(values);
        break;
      case 'geometric':
        finalValue = calculateGeometricMean(values);
        break;
      case 'median':
        finalValue = calculateMedian(values);
        break;
      default:
        throw new Error(
          'Invalid consensus method. Use: arithmetic, geometric, or median.',
        );
    }

    finalMatrix.push([alternativeId, criterionId, finalValue]);
  }

  const projectAlternatives =
    await alternativeRepository.findByProjectId(projectId);
  const altIds = projectAlternatives.map((a) => a.id);

  if (altIds.length > 0) {
    await evaluationRepository.deleteByAlternativeIds(altIds);
    await evaluationRepository.saveMany(finalMatrix);
  }

  return {
    message: 'Consensus calculated and applied successfully',
    methodUsed: method,
    updatedRecords: finalMatrix.length,
  };
};
