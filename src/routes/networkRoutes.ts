import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getNetworkHealth, getAnomalies } from '../controllers/networkController';

const router = Router();
router.use(authenticate);
router.get('/health', getNetworkHealth);
router.get('/anomalies', getAnomalies);

export default router;
