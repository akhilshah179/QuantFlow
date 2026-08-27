import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

const ipHitsMap = new Map<string, { count: number; resetTime: number }>();
const DEFAULT_MAX_HITS = config.nodeEnv === 'development' ? 1000 : 100;
const MAX_HITS = parseInt(process.env.AUTH_RATE_LIMIT_MAX || '', 10) || DEFAULT_MAX_HITS;
const WINDOW_MS = 15 * 60 * 1000;

export function authRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

  // In development, bypass rate limiting for localhost requests
  if (config.nodeEnv === 'development' && (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1')) {
    return next();
  }

  const now = Date.now();
  const record = ipHitsMap.get(ip);

  if (!record || now > record.resetTime) {
    ipHitsMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }

  if (record.count >= MAX_HITS) {
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts. Please try again after 15 minutes.',
    });
    return;
  }

  record.count += 1;
  next();
}

export function resetRateLimits() {
  ipHitsMap.clear();
}

