import { Router } from 'express';
import { getTasks, createTask, completeTask, updateTask } from '../controllers/taskController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.patch('/:id/complete', completeTask);

export default router;
