import { Router } from 'express';
import { loginStep1, loginStep2, getMe, getWahaStatus } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', loginStep1);           // paso 1: usuario + contraseña → OTP
router.post('/login/verify', loginStep2);    // paso 2: OTP → JWT
router.get('/me', authenticate, getMe);
router.get('/waha-status', getWahaStatus);   // público: estado de WhatsApp

export default router;
