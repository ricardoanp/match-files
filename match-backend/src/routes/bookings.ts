import { Router } from 'express';
import { bookingController } from '../controllers/BookingController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { idempotencyMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/', authMiddleware, requireRole('JOGADOR'), bookingController.createBooking);
router.get('/:id', authMiddleware, bookingController.getBooking);
router.post(
  '/:id/pay',
  authMiddleware,
  idempotencyMiddleware,
  requireRole('JOGADOR'),
  bookingController.capturePayment
);
router.post('/:id/cancel', authMiddleware, bookingController.cancelBooking);
router.post('/:id/check-in', authMiddleware, bookingController.checkIn);

export default router;
