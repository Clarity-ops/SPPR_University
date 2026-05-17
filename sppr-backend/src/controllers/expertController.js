import stream from 'stream';
import csv from 'csv-parser';
import * as expertService from '../services/expertService.js';
import * as consensusService from '../services/consensusService.js';
import * as weightVotingService from '../services/weightVotingService.js';

export const getProjectExperts = async (req, res) => {
  try {
    const { projectId } = req.params;
    const experts = await expertService.getProjectExperts(projectId);
    res.json(experts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createExpertProfile = async (req, res) => {
  try {
    const { projectId } = req.params;
    const newExpert = await expertService.createExpertProfile(
      projectId,
      req.body,
    );
    res.status(201).json(newExpert);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateExpert = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedExpert = await expertService.updateExpert(id, req.body);
    res.json(updatedExpert);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteExpert = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await expertService.deleteExpert(id);
    if (!success) {
      return res.status(404).json({ error: 'Expert not found' });
    }
    res.json({ message: 'Expert deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getExpertData = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await expertService.getExpertData(id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Applies consensus math to expert evaluations and updates the main evaluations matrix
 */
export const applyConsensus = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { method } = req.body; // Expected: 'arithmetic', 'geometric', or 'median'

    if (!method) {
      return res.status(400).json({
        error:
          'Consensus method is required in the request body (e.g., {"method": "arithmetic"})',
      });
    }

    const result = await consensusService.calculateConsensus(projectId, method);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 1. Збереження ручних оцінок з модалки
export const saveManualData = async (req, res) => {
  try {
    const { id } = req.params;
    const { evaluations, weightVotes } = req.body;
    const result = await expertService.saveExpertFullData(
      id,
      evaluations,
      weightVotes,
    );
    res
      .status(200)
      .json({ message: 'Expert data saved successfully', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Імпорт рангів критеріїв через CSV
export const importVotesCsv = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!req.file)
      return res.status(400).json({ error: 'No CSV file uploaded' });

    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          const expertsMap = new Map();
          results.forEach((row) => {
            const { expertName, criterionId, rank } = row;
            if (!expertName || !criterionId || !rank) return;
            if (!expertsMap.has(expertName)) expertsMap.set(expertName, []);
            expertsMap.get(expertName).push({
              criterionId: parseInt(criterionId, 10),
              rank: parseFloat(rank),
            });
          });

          let importedVotesCount = 0;
          for (const [expertName, votes] of expertsMap) {
            let experts = await expertService.getProjectExperts(projectId);
            let existingExpert = experts.find((e) => e.name === expertName);
            let expertId = existingExpert
              ? existingExpert.id
              : (
                  await expertService.addExpertWithEvaluations(projectId, {
                    name: expertName,
                    description: 'Imported',
                  })
                ).expert.id;

            await expertService.saveExpertWeightVotes(expertId, votes);
            importedVotesCount += votes.length;
          }
          res
            .status(201)
            .json({ message: 'Votes imported', count: importedVotesCount });
        } catch (err) {
          res.status(500).json({ error: err.message });
        }
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handles CSV upload, parses rows, groups by expert name, and saves via service layer.
 */
export const importExpertsCsv = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          const expertsMap = new Map();

          // Grouping flat CSV rows into structured JavaScript objects
          results.forEach((row) => {
            const {
              expertName,
              description,
              alternativeId,
              criterionId,
              value,
            } = row;

            if (!expertName) return;

            if (!expertsMap.has(expertName)) {
              expertsMap.set(expertName, {
                name: expertName.trim(),
                description: description ? description.trim() : '',
                evaluations: [],
              });
            }

            if (alternativeId && criterionId && value) {
              expertsMap.get(expertName).evaluations.push({
                alternativeId: parseInt(alternativeId, 10),
                criterionId: parseInt(criterionId, 10),
                value: parseFloat(value),
              });
            }
          });

          const createdData = [];

          // Iterating through grouped map and sending data to the Service layer
          // eslint-disable-next-line no-unused-vars
          for (const [_, expertData] of expertsMap) {
            const result = await expertService.processImportedExpertEvaluations(
              projectId,
              expertData,
            );
            createdData.push(result);
          }

          res.status(201).json({
            message: 'Import successful',
            importedExpertsCount: createdData.length,
            details: createdData,
          });
        } catch (err) {
          res
            .status(500)
            .json({ error: 'Error processing CSV data: ' + err.message });
        }
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Запуск розрахунку ваг критеріїв (з попереднього етапу)
export const applyWeightsVoting = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { method } = req.body;
    if (!method)
      return res.status(400).json({ error: 'Voting method required' });
    const result = await weightVotingService.calculateAndApplyWeights(
      projectId,
      method,
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
