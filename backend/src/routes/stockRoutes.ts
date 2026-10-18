import { Router } from 'express';
import { searchStocks, getStockDetails, getStockHistory, getMarketOverview, runScreener } from '../controllers/stockController';

const router = Router();

router.get('/search', searchStocks);
router.get('/screener', runScreener);
router.get('/market/overview', getMarketOverview);
router.get('/:symbol', getStockDetails);
router.get('/:symbol/history', getStockHistory);

export default router;
