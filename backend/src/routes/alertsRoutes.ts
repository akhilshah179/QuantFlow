import { Router } from 'express';
import { getUserAlerts, createAlert, deleteAlert } from '../controllers/alertsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);
router.get('/', getUserAlerts);
router.post('/', createAlert);
router.delete('/:id', deleteAlert);

export default router;
