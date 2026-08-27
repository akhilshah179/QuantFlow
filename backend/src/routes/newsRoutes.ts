import { Router } from 'express';
import { getMarketNews, getCompanyNews } from '../controllers/newsController';

const router = Router();

router.get('/', getMarketNews);
router.get('/:symbol', getCompanyNews);

export default router;
