import { Request, Response, NextFunction } from 'express';
import { stockService } from '../services/stockService';

export async function searchStocks(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (req.query.q as string) || '';
    const results = await stockService.searchStocks(query);
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
}

export async function resolveSymbol(req: Request, res: Response, next: NextFunction) {
  try {
    const { symbol } = req.params;
    const resolved = stockService.resolveSymbol(symbol);
    res.status(200).json({ success: true, data: resolved });
  } catch (err) {
    next(err);
  }
}

export async function getStockDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const { symbol } = req.params;
    const quote = await stockService.getStockQuote(symbol);
    res.status(200).json({ success: true, data: quote });
  } catch (err: any) {
    if (err.statusCode) {
      res.status(err.statusCode).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
}

export async function getStockHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const { symbol } = req.params;
    const timeframe = (req.query.timeframe as string) || '1D';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 300;
    const data = await stockService.getHistoricalData(symbol, timeframe, limit);
    res.status(200).json({ success: true, data });
  } catch (err: any) {
    if (err.statusCode) {
      res.status(err.statusCode).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
}

export async function getMarketOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const overview = await stockService.getMarketOverview();
    res.status(200).json({ success: true, data: overview });
  } catch (err) {
    next(err);
  }
}

export async function runScreener(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = {
      exchange: req.query.exchange as string,
      sector: req.query.sector as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      minMarketCap: req.query.minMarketCap ? parseFloat(req.query.minMarketCap as string) : undefined,
      maxPeRatio: req.query.maxPeRatio ? parseFloat(req.query.maxPeRatio as string) : undefined,
      minDividendYield: req.query.minDividendYield ? parseFloat(req.query.minDividendYield as string) : undefined,
      query: req.query.query as string,
    };
    const results = await stockService.runScreener(filters);
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
}
