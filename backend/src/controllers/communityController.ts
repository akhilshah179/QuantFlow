import { Request, Response, NextFunction } from 'express';
import { communityService } from '../services/communityService';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getTradeIdeas(req: Request, res: Response, next: NextFunction) {
  try {
    const symbol = req.query.symbol as string;
    const ideas = await communityService.getTradeIdeas(symbol);
    res.status(200).json({ success: true, data: ideas });
  } catch (err) {
    next(err);
  }
}

export async function createTradeIdea(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }
    const { symbol, title, description, chartSnapshot } = req.body;
    if (!symbol || !title || !description) {
      res.status(400).json({ success: false, error: 'Symbol, title, and description are required.' });
      return;
    }
    const idea = await communityService.createTradeIdea({
      userId: req.user.userId,
      symbol,
      title,
      description,
      chartSnapshot,
    });
    res.status(201).json({ success: true, data: idea });
  } catch (err) {
    next(err);
  }
}

export async function likeTradeIdea(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const idea = await communityService.likeTradeIdea(id);
    res.status(200).json({ success: true, data: idea });
  } catch (err) {
    next(err);
  }
}

export async function addComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }
    const { id } = req.params;
    const { content } = req.body;
    if (!content) {
      res.status(400).json({ success: false, error: 'Comment content is required.' });
      return;
    }
    const comment = await communityService.addComment(id, req.user.userId, content);
    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
}
