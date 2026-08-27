import { Request, Response, NextFunction } from 'express';
import { ForexDataProvider } from '../providers/ForexDataProvider';

const forexProvider = new ForexDataProvider();

export async function getForexOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await forexProvider.getMarketOverview();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getForexQuote(req: Request, res: Response, next: NextFunction) {
  try {
    const { symbol } = req.params;
    const quote = await forexProvider.getQuote(symbol);
    res.status(200).json({ success: true, data: quote });
  } catch (err) {
    next(err);
  }
}
