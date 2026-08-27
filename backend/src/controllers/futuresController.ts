import { Request, Response, NextFunction } from 'express';
import { FuturesDataProvider } from '../providers/FuturesDataProvider';

const futuresProvider = new FuturesDataProvider();

export async function getFuturesOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await futuresProvider.getMarketOverview();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getFuturesQuote(req: Request, res: Response, next: NextFunction) {
  try {
    const { symbol } = req.params;
    const quote = await futuresProvider.getQuote(symbol);
    res.status(200).json({ success: true, data: quote });
  } catch (err) {
    next(err);
  }
}
