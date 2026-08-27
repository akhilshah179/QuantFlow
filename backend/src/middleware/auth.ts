import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized access. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }
}
