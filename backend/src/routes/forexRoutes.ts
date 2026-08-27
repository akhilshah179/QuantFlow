import { Router } from 'express';
import { getForexOverview, getForexQuote } from '../controllers/forexController';

const router = Router();

router.get('/overview', getForexOverview);
router.get('/:symbol', getForexQuote);

export default router;
