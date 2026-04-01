import { Router } from 'express';
import * as evaluationController from '../controllers/evaluationController.js';

const router = Router();

router.get('/project/:projectId', evaluationController.getEvaluations);
router.post('/', evaluationController.saveEvaluation);

export default router;
