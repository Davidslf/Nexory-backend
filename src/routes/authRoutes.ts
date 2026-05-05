import { Router } from 'express';
import { loginStep1, loginStep2, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', loginStep1);         // paso 1: usuario + contraseña → OTP
router.post('/login/verify', loginStep2);  // paso 2: OTP → JWT
router.get('/me', authenticate, getMe);

export default router;
