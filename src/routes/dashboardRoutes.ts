import { Router } from 'express';
import { getDashboardStats, getActivities } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/activities', getActivities);

export default router;
