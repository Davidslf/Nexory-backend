import { Router } from 'express';
import { getBillingData } from '../controllers/billingController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireRole('admin')); // Only admins can view billing

router.get('/', getBillingData);

export default router;
