/* eslint-disable no-unused-vars */
/**
 * Utility for calculating criteria weights based on expert ranks.
 * Expects `vote_value` to represent the RANK (1 = best/most important, 2, 3, ...).
 * All methods return an array: [{ criterionId: 1, weight: 0.45 }, ...]
 */

const normalizeScores = (scoresObj) => {
  const totalScore = Object.values(scoresObj).reduce((a, b) => a + b, 0);
  const weights = [];

  for (const [critId, score] of Object.entries(scoresObj)) {
    weights.push({
      criterionId: parseInt(critId, 10),
      weight: totalScore > 0 ? Number((score / totalScore).toFixed(4)) : 0,
    });
  }
  return weights;
};

// 1. Правило відносної більшості
export const calculateRelativeMajority = (votesByExpert, criteriaIds) => {
  const scores = {};
  criteriaIds.forEach((id) => (scores[id] = 0));

  for (const [expertId, votes] of votesByExpert.entries()) {
    // Знаходимо мінімальний ранг (перше місце) для цього експерта
    const firstPlaceRank = Math.min(...votes.map((v) => v.value));

    votes.forEach((v) => {
      if (v.value === firstPlaceRank) {
        scores[v.criterionId] += 1;
      }
    });
  }

  return normalizeScores(scores);
};

// 2. Правило Борда
export const calculateBorda = (votesByExpert, criteriaIds) => {
  const scores = {};
  criteriaIds.forEach((id) => (scores[id] = 0));
  const M = criteriaIds.length;

  for (const [expertId, votes] of votesByExpert.entries()) {
    votes.forEach((v) => {
      // За підручником: перше місце = (m - 1) балів, друге = (m - 2), ..., останнє = 0
      // Оскільки v.value - це ранг (1, 2, ...), формула: M - ранг
      // Щоб уникнути від'ємних значень, беремо Math.max(0, M - v.value)
      scores[v.criterionId] += Math.max(0, M - v.value);
    });
  }

  return normalizeScores(scores);
};

// Helper for pairwise comparisons (Copeland and Simpson)
const getPairwiseWins = (votesByExpert, criteriaIds) => {
  const pairwise = {}; // pairwise[A][B] = count of experts where rank A < rank B
  criteriaIds.forEach((a) => {
    pairwise[a] = {};
    criteriaIds.forEach((b) => (pairwise[a][b] = 0));
  });

  for (const [expertId, votes] of votesByExpert.entries()) {
    for (let i = 0; i < votes.length; i++) {
      for (let j = 0; j < votes.length; j++) {
        if (i !== j) {
          const critA = votes[i];
          const critB = votes[j];
          // Менший ранг означає кращу позицію
          if (critA.value < critB.value) {
            pairwise[critA.criterionId][critB.criterionId] += 1;
          }
        }
      }
    }
  }
  return pairwise;
};

// 3. Правило Копленда
export const calculateCopeland = (votesByExpert, criteriaIds) => {
  const pairwise = getPairwiseWins(votesByExpert, criteriaIds);
  const copelandScores = {};
  const M = criteriaIds.length;

  criteriaIds.forEach((a) => {
    let score = 0;
    criteriaIds.forEach((x) => {
      if (a !== x) {
        if (pairwise[a][x] > pairwise[x][a]) score += 1;
        else if (pairwise[a][x] < pairwise[x][a]) score -= 1;
      }
    });
    // Копленд може давати від'ємні оцінки (від -(M-1) до M-1).
    // Щоб перетворити це на ваги, зміщуємо всі оцінки на +(M-1), щоб мінімум був 0.
    copelandScores[a] = score + (M - 1);
  });

  return normalizeScores(copelandScores);
};

// 4. Правило Сімпсона
export const calculateSimpson = (votesByExpert, criteriaIds) => {
  const pairwise = getPairwiseWins(votesByExpert, criteriaIds);
  const simpsonScores = {};

  criteriaIds.forEach((a) => {
    let minScore = Infinity;
    criteriaIds.forEach((x) => {
      if (a !== x) {
        if (pairwise[a][x] < minScore) {
          minScore = pairwise[a][x];
        }
      }
    });
    simpsonScores[a] = minScore === Infinity ? 0 : minScore;
  });

  return normalizeScores(simpsonScores);
};
