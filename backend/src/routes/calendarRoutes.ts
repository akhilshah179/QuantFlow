import { Router } from 'express';
import { getEconomicEvents, getIPOCalendar } from '../controllers/calendarController';

const router = Router();

router.get('/economic', getEconomicEvents);
router.get('/ipo', getIPOCalendar);

export default router;
