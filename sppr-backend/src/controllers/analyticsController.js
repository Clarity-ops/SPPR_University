import * as analyticsService from '../services/analyticsService.js';

export const getProjectRanking = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const analyticsResult = await analyticsService.calculateRanking(projectId);

    res.status(200).json(analyticsResult);
  } catch (error) {
    if (
      error.message.includes('Not enough data') ||
      error.message.includes('Incomplete matrix')
    ) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};
