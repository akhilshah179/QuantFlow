import { Router } from 'express';
import { getWatchlists, createWatchlist, addStock, removeStock } from '../controllers/watchlistController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getWatchlists);
router.post('/', createWatchlist);
router.post('/:id/stocks', addStock);
router.delete('/:id/stocks/:symbol', removeStock);

export default router;
