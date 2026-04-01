import { findByProjectId as findAlternativeByProjectId } from '../repositories/alternativeRepository.js';
import { findByProjectId as findCriterionByProjectId } from '../repositories/criterionRepository.js';
import { findByProject as findEvaluationByProjectId } from '../repositories/evaluationRepository.js';

export const calculateProjectRanking = async (projectId) => {
  // 1. Fetch all required data for the project
  const alternatives = await findAlternativeByProjectId(projectId);
  const criterias = await findCriterionByProjectId(projectId);

  if (alternatives.length === 0 || criterias.length === 0) {
    throw new Error(
      'Not enough data to calculate ranking. Ensure you have alternatives and criteria.',
    );
  }

  const evaluations = await findEvaluationByProjectId(projectId);

  // 2. Build the Matrix and find Min/Max for each criterion
  const matrix = {}; // { altId: { critId: value } }
  const critBounds = {}; // { critId: { min: val, max: val } }

  criterias.forEach((c) => {
    critBounds[c.id] = { min: Infinity, max: -Infinity };
  });

  evaluations.forEach((e) => {
    if (!matrix[e.alternative_id]) matrix[e.alternative_id] = {};
    matrix[e.alternative_id][e.criterion_id] = Number(e.value);

    if (e.value < critBounds[e.criterion_id].min)
      critBounds[e.criterion_id].min = Number(e.value);
    if (e.value > critBounds[e.criterion_id].max)
      critBounds[e.criterion_id].max = Number(e.value);
  });

  // 3. Normalize values & Calculate Scores
  const results = alternatives.map((alt) => {
    let sawScore = 0;
    let wpmScore = 1;
    let missingData = false;

    criterias.forEach((crit) => {
      const rawValue = matrix[alt.id]?.[crit.id];
      if (rawValue === undefined) {
        missingData = true;
        return;
      }

      let normalizedValue = 0;
      const { min, max } = critBounds[crit.id];

      // Prevent division by zero if all values are identical
      if (max === min) {
        normalizedValue = 1;
      } else {
        // Robust Min-Max Normalization
        if (crit.type === 'maximize') {
          normalizedValue = (rawValue - min) / (max - min);
        } else if (crit.type === 'minimize') {
          normalizedValue = (max - rawValue) / (max - min);
        }
      }

      const weight = Number(crit.weight);

      // Simple Additive Weighting (SAW)
      sawScore += normalizedValue * weight;

      // Weighted Product Model (WPM)
      // We clamp the minimum value to 0.0001 for WPM to prevent absolute zero
      // from wiping out the entire multiplication chain.
      const wpmSafeValue = Math.max(normalizedValue, 0.0001);
      wpmScore *= Math.pow(wpmSafeValue, weight);
    });

    return {
      alternative_id: alt.id,
      name: alt.name,
      sawScore: missingData ? null : Number(sawScore.toFixed(4)),
      wpmScore: missingData ? null : Number(wpmScore.toFixed(4)),
      missingData,
    };
  });

  if (results.some((r) => r.missingData)) {
    throw new Error(
      'Incomplete matrix: All alternatives must have values for all criteria.',
    );
  }

  // 4. Sort and Rank (Based on SAW by default, highest is best)
  results.sort((a, b) => b.sawScore - a.sawScore);

  // 5. Generate Explanation
  const bestAlt = results[0];
  const explanation = `Based on the Simple Additive Weighting (SAW) method, the optimal choice is '${bestAlt.name}' with a score of ${bestAlt.sawScore}. The Weighted Product Model (WPM) confirms a score of ${bestAlt.wpmScore}.`;

  return {
    rankings: results,
    explanation,
    methodsUsed: [
      'Simple Additive Weighting (SAW)',
      'Weighted Product Model (WPM)',
    ],
  };
};
