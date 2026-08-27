import { Router } from 'express';
import { getCryptoOverview, getCryptoQuote } from '../controllers/cryptoController';

const router = Router();

router.get('/overview', getCryptoOverview);
router.get('/:symbol', getCryptoQuote);

export default router;
