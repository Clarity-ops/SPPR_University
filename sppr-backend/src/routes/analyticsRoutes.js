import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController.js';

const router = Router();

router.get('/:projectId/ranking', analyticsController.getProjectRanking);

export default router;
