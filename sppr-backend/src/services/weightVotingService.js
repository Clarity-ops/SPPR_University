import * as votingMath from '../utils/votingMath.js';
import * as criterionRepository from '../repositories/criterionRepository.js';
import * as expertRepository from '../repositories/expertRepository.js';

export const calculateAndApplyWeights = async (projectId, method) => {
  const criteria = await criterionRepository.findByProjectId(projectId);
  if (!criteria.length) throw new Error('No criteria found for this project');

  const criteriaIds = criteria.map((c) => c.id);

  const votes = await expertRepository.getWeightVotesByProjectId(projectId);

  if (!votes.length) throw new Error('No voting data found');

  // Групуємо всі голоси (ранги) по експертах
  const votesByExpert = new Map();
  votes.forEach((row) => {
    if (!votesByExpert.has(row.expert_id)) {
      votesByExpert.set(row.expert_id, []);
    }
    votesByExpert.get(row.expert_id).push({
      criterionId: row.criterion_id,
      value: Number(row.vote_value), // Це ранг: 1, 2, 3...
    });
  });

  let newWeights;
  switch (method) {
    case 'relative_majority':
      newWeights = votingMath.calculateRelativeMajority(
        votesByExpert,
        criteriaIds,
      );
      break;
    case 'borda':
      newWeights = votingMath.calculateBorda(votesByExpert, criteriaIds);
      break;
    case 'copeland':
      newWeights = votingMath.calculateCopeland(votesByExpert, criteriaIds);
      break;
    case 'simpson':
      newWeights = votingMath.calculateSimpson(votesByExpert, criteriaIds);
      break;
    default:
      throw new Error(
        'Invalid voting method. Use: relative_majority, borda, copeland, simpson',
      );
  }

  for (const item of newWeights) {
    await criterionRepository.updateWeight(item.criterionId, item.weight);
  }

  return {
    message: 'Weights successfully calculated and updated',
    methodUsed: method,
    weights: newWeights,
  };
};
