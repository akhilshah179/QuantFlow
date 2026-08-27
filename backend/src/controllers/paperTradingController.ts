import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { paperTradingService } from '../services/paperTradingService';

export async function buyStock(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { symbol, quantity } = req.body;
    if (!symbol || !quantity) {
      res.status(400).json({ success: false, error: 'Symbol and quantity are required.' });
      return;
    }

    const result = await paperTradingService.executeOrder({
      userId,
      symbol,
      type: 'BUY',
      quantity: Number(quantity),
    });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function sellStock(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { symbol, quantity } = req.body;
    if (!symbol || !quantity) {
      res.status(400).json({ success: false, error: 'Symbol and quantity are required.' });
      return;
    }

    const result = await paperTradingService.executeOrder({
      userId,
      symbol,
      type: 'SELL',
      quantity: Number(quantity),
    });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getPortfolio(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const summary = await paperTradingService.getPortfolioSummary(userId);
    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
}

export async function getTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const txs = await paperTradingService.getTransactions(userId);
    res.status(200).json({ success: true, data: txs });
  } catch (err) {
    next(err);
  }
}
