import { Router } from 'express';
import { getClients, getClient, createClient, updateClient, toggleClientStatus, getClientHistory } from '../controllers/clientController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getClients);
router.post('/', createClient);
router.get('/:id', getClient);
router.put('/:id', updateClient);
router.patch('/:id/toggle-status', toggleClientStatus);
router.get('/:id/history', getClientHistory);

export default router;
