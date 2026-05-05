import { Router } from 'express';
import { getRouters, getRouterById, toggleRouterStatus } from '../controllers/routerController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getRouters);
router.get('/:id', getRouterById);
router.patch('/:id/status', requireRole('admin'), toggleRouterStatus);

export default router;
