import { Router } from 'express';
import * as alternativeController from '../controllers/alternativeController.js';

const router = Router();

router.get('/project/:projectId', alternativeController.getAlternatives);
router.post('/', alternativeController.createAlternative);
router.put('/:id', alternativeController.updateAlternative);
router.delete('/:id', alternativeController.deleteAlternative);
export default router;
