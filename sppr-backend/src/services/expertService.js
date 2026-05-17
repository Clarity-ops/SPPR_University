import * as expertRepository from '../repositories/expertRepository.js';

export const addExpertWithEvaluations = async (projectId, expertData) => {
  const { name, description, evaluations } = expertData;

  if (!name) {
    throw new Error('Expert name is required');
  }

  const newExpert = await expertRepository.createExpert(
    projectId,
    name,
    description,
  );

  let savedEvaluationsCount = 0;
  if (evaluations && Array.isArray(evaluations)) {
    const validEvaluations = evaluations.filter(
      (e) => e.alternativeId && e.criterionId && typeof e.value === 'number',
    );

    if (validEvaluations.length > 0) {
      savedEvaluationsCount = await expertRepository.createExpertEvaluations(
        newExpert.id,
        validEvaluations,
      );
    }
  }

  return {
    expert: newExpert,
    evaluationsCount: savedEvaluationsCount,
  };
};

export const getProjectExperts = async (projectId) => {
  return await expertRepository.findExpertsByProjectId(projectId);
};

export const getExpertEvaluations = async (expertId) => {
  return await expertRepository.getEvaluationsByExpertId(expertId);
};

export const getExpertData = async (expertId) => {
  const evaluations = await expertRepository.getEvaluationsByExpertId(expertId);
  const weightVotes = await expertRepository.getWeightVotesByExpertId(expertId);

  return {
    evaluations: evaluations.map((e) => ({
      alternativeId: e.alternative_id,
      criterionId: e.criterion_id,
      value: e.value,
    })),
    weightVotes: weightVotes.map((v) => ({
      criterionId: v.criterion_id,
      rank: v.vote_value,
    })),
  };
};

export const createExpertProfile = async (projectId, data) => {
  const { name, description } = data;
  if (!name) {
    throw new Error('Expert name is required');
  }
  // Викликаємо існуючу функцію з репозиторію
  return await expertRepository.createExpert(projectId, name, description);
};

export const updateExpert = async (id, data) => {
  if (!data.name) {
    throw new Error('Expert name is required');
  }
  return await expertRepository.updateExpert(id, data);
};

export const deleteExpert = async (id) => {
  return await expertRepository.removeExpert(id);
};

export const saveExpertFullData = async (
  expertId,
  evaluations,
  weightVotes,
) => {
  // Очищаємо попередні дані цього експерта
  await expertRepository.clearExpertData(expertId);

  let evalsSaved = 0;
  let votesSaved = 0;

  if (evaluations && evaluations.length > 0) {
    evalsSaved = await expertRepository.createExpertEvaluations(
      expertId,
      evaluations,
    );
  }

  if (weightVotes && weightVotes.length > 0) {
    votesSaved = await expertRepository.createExpertWeightVotes(
      expertId,
      weightVotes,
    );
  }

  return { evalsSaved, votesSaved };
};

export const saveExpertWeightVotes = async (expertId, weightVotes) => {
  await expertRepository.clearExpertWeightVotes(expertId);

  if (!weightVotes || weightVotes.length === 0) {
    return { votesSaved: 0 };
  }

  const votesSaved = await expertRepository.createExpertWeightVotes(
    expertId,
    weightVotes,
  );

  return { votesSaved };
};

/**
 * Processes a single expert data block from CSV, handling deduplication and overwrites.
 */
export const processImportedExpertEvaluations = async (
  projectId,
  expertData,
) => {
  const { name, description, evaluations } = expertData;

  if (!name) {
    throw new Error('Expert name is required');
  }

  // 1. Check if the expert already exists in this project to prevent duplicates
  let expert = await expertRepository.findByNameAndProject(projectId, name);

  if (!expert) {
    expert = await expertRepository.createExpert(projectId, name, description);
  } else if (description) {
    // Update description if a new one is provided in the CSV
    await expertRepository.updateExpert(expert.id, { name, description });
  }

  // 2. Clear previous evaluations for this specific expert to prevent primary key conflicts
  await expertRepository.clearExpertEvaluations(expert.id);

  // 3. Save new evaluations safely
  let savedEvaluationsCount = 0;
  if (evaluations && Array.isArray(evaluations)) {
    const validEvaluations = evaluations.filter(
      (e) => e.alternativeId && e.criterionId && typeof e.value === 'number',
    );

    if (validEvaluations.length > 0) {
      savedEvaluationsCount = await expertRepository.createExpertEvaluations(
        expert.id,
        validEvaluations,
      );
    }
  }

  return {
    expert,
    evaluationsCount: savedEvaluationsCount,
  };
};
