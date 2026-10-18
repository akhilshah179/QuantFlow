import { Request, Response, NextFunction } from 'express';
import { CryptoDataProvider } from '../providers/CryptoDataProvider';

const cryptoProvider = new CryptoDataProvider();

export async function getCryptoOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await cryptoProvider.getMarketOverview();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getCryptoQuote(req: Request, res: Response, next: NextFunction) {
  try {
    const { symbol } = req.params;
    const quote = await cryptoProvider.getQuote(symbol);
    res.status(200).json({ success: true, data: quote });
  } catch (err) {
    next(err);
  }
}
