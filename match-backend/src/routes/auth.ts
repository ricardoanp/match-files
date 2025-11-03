import { Router } from 'express';
import { authController } from '../controllers/AuthController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.patch('/me/consents', authMiddleware, authController.updateConsents);

export default router;
