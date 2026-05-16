import { Router } from 'express';
import {
  getClients, getClient, createClient, updateClient,
  toggleClientStatus, getClientHistory,
  diagnoseClientFull, restartClientSession,
} from '../controllers/clientController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getClients);
router.post('/', createClient);
router.get('/:id', getClient);
router.put('/:id', updateClient);
router.patch('/:id/toggle-status', toggleClientStatus);
router.get('/:id/history', getClientHistory);
router.get('/:id/diagnose', diagnoseClientFull);
router.post('/:id/restart-session', restartClientSession);

export default router;
