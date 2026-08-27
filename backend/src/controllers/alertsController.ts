import { Response, NextFunction } from 'express';
import { alertService } from '../services/alertService';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getUserAlerts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }
    const alerts = await alertService.getAlertsForUser(req.user.userId);
    res.status(200).json({ success: true, data: alerts });
  } catch (err) {
    next(err);
  }
}

export async function createAlert(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }
    const { symbol, targetPrice, condition } = req.body;
    if (!symbol || targetPrice === undefined || !condition) {
      res.status(400).json({ success: false, error: 'Symbol, targetPrice, and condition (ABOVE/BELOW) are required.' });
      return;
    }
    const alert = await alertService.createAlert({
      userId: req.user.userId,
      symbol,
      targetPrice: Number(targetPrice),
      condition,
    });
    res.status(201).json({ success: true, data: alert });
  } catch (err) {
    next(err);
  }
}

export async function deleteAlert(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }
    const { id } = req.params;
    await alertService.deleteAlert(id, req.user.userId);
    res.status(200).json({ success: true, message: 'Alert deleted successfully.' });
  } catch (err) {
    next(err);
  }
}
