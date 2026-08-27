import { Router } from 'express';
import { buyStock, sellStock, getPortfolio, getTransactions } from '../controllers/paperTradingController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/orders/buy', buyStock);
router.post('/orders/sell', sellStock);
router.get('/portfolio', getPortfolio);
router.get('/transactions', getTransactions);

export default router;
