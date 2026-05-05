import { Router } from 'express';
import { getTickets, createTicket, updateTicket, closeTicket, addTicketNote } from '../controllers/supportController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getTickets);
router.post('/', createTicket);
router.put('/:id', updateTicket);
router.post('/:id/close', closeTicket);
router.post('/:id/notes', addTicketNote);

export default router;
