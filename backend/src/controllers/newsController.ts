import { Request, Response, NextFunction } from 'express';
import { newsService } from '../services/newsService';

export async function getMarketNews(req: Request, res: Response, next: NextFunction) {
  try {
    const category = (req.query.category as string) || 'all';
    const search = (req.query.search as string) || '';
    const articles = await newsService.getMarketNews(category, search);
    res.status(200).json({ success: true, data: articles });
  } catch (err) {
    next(err);
  }
}

export async function getCompanyNews(req: Request, res: Response, next: NextFunction) {
  try {
    const { symbol } = req.params;
    const articles = await newsService.getCompanyNews(symbol);
    res.status(200).json({ success: true, data: articles });
  } catch (err) {
    next(err);
  }
}
