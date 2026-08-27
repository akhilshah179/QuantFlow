import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { watchlistService } from '../services/watchlistService';

export async function getWatchlists(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const watchlists = await watchlistService.getUserWatchlists(userId);
    res.status(200).json({ success: true, data: watchlists });
  } catch (err) {
    next(err);
  }
}

export async function createWatchlist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: 'Watchlist name is required.' });
      return;
    }
    const watchlist = await watchlistService.createWatchlist(userId, name);
    res.status(201).json({ success: true, data: watchlist });
  } catch (err) {
    next(err);
  }
}

export async function addStock(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { symbol } = req.body;
    if (!symbol) {
      res.status(400).json({ success: false, error: 'Stock symbol is required.' });
      return;
    }
    const item = await watchlistService.addStockToWatchlist(userId, id, symbol);
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function removeStock(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { id, symbol } = req.params;
    const result = await watchlistService.removeStockFromWatchlist(userId, id, symbol);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
