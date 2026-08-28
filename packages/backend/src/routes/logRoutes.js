import { Router } from 'express';
import { applySampleData, createLog, getLogs, updateLog } from '../controllers/logController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);
router.post('/sample-data', applySampleData);
router.post('/', createLog);
router.get('/', getLogs);
router.put('/:id', updateLog);

export default router;