import { Request, Response, NextFunction } from 'express';
import { calendarService } from '../services/calendarService';

export async function getEconomicEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const events = await calendarService.getEconomicEvents();
    res.status(200).json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
}

export async function getIPOCalendar(req: Request, res: Response, next: NextFunction) {
  try {
    const listings = await calendarService.getIPOCalendar();
    res.status(200).json({ success: true, data: listings });
  } catch (err) {
    next(err);
  }
}
