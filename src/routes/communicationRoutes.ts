import { Router } from 'express';
import { getCommunications, sendCommunication } from '../controllers/communicationController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getCommunications);
router.post('/send', sendCommunication);

export default router;
