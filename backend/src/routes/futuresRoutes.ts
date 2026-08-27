import { Router } from 'express';
import { getFuturesOverview, getFuturesQuote } from '../controllers/futuresController';

const router = Router();

router.get('/overview', getFuturesOverview);
router.get('/:symbol', getFuturesQuote);

export default router;
