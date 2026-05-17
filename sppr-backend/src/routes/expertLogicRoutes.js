import express from 'express';
import * as expertLogicController from '../controllers/expertLogicController.js';

const router = express.Router();

// --- Thresholds Routes ---
router.get(
  '/project/:projectId/thresholds',
  expertLogicController.getProjectThresholds,
);
// Використовуємо POST для upsert (створення або оновлення)
router.post(
  '/project/:projectId/thresholds',
  expertLogicController.saveThreshold,
);
router.delete('/thresholds/:id', expertLogicController.deleteThreshold);

// --- Rules (IF-THEN) Routes ---
router.get('/project/:projectId/rules', expertLogicController.getProjectRules);
router.post('/project/:projectId/rules', expertLogicController.createRule);
router.delete('/rules/:id', expertLogicController.deleteRule);

export default router;
