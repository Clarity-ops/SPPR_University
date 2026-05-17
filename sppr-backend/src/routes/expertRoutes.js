import express from 'express';
import multer from 'multer';
import * as expertController from '../controllers/expertController.js';

const router = express.Router();

// Setup multer to store file in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for safety
});

// Standard CRUD
router.get('/project/:projectId', expertController.getProjectExperts);
router.post('/project/:projectId', expertController.createExpertProfile);
router.put('/:id', expertController.updateExpert);
router.delete('/:id', expertController.deleteExpert);
router.get('/:id/data', expertController.getExpertData);

// CSV Import Route
router.post(
  '/project/:projectId/import-votes',
  upload.single('file'),
  expertController.importVotesCsv,
);
router.post(
  '/project/:projectId/import',
  upload.single('file'),
  expertController.importExpertsCsv,
);
// Data endpoints

router.post('/:id/data', expertController.saveManualData);
router.post(
  '/project/:projectId/weights-voting',
  expertController.applyWeightsVoting,
);
// Apply Consensus to evaluate alternatives
router.post('/project/:projectId/consensus', expertController.applyConsensus);

export default router;
