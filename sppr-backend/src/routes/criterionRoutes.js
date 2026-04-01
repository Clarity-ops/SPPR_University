import { Router } from 'express';
import * as criterionController from '../controllers/criterionController.js';

const router = Router();

router.get('/project/:projectId', criterionController.getCriteria);
router.post('/', criterionController.createCriterion);
router.put('/:id', criterionController.updateCriterion);
router.delete('/:id', criterionController.deleteCriterion);
export default router;
