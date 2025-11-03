import { Router } from 'express';
import { courtController } from '../controllers/CourtController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/', authMiddleware, requireRole('GESTOR_QUADRA', 'ADMIN'), courtController.create);
router.get('/', courtController.list);
router.get('/:id', courtController.getById);
router.patch(
  '/:id',
  authMiddleware,
  requireRole('GESTOR_QUADRA', 'ADMIN'),
  courtController.update
);

export default router;
