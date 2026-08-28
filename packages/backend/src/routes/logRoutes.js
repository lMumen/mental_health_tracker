import { Router } from 'express';
import { createLog, getLogs } from '../controllers/logController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);
router.post('/', createLog);
router.get('/', getLogs);

export default router;