import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { AuthenticatedRequest } from '../middleware/auth';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ success: false, error: 'Full name, email, and password are required.' });
      return;
    }
    const result = await authService.register({ email, password, name });
    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    if (err.statusCode) {
      res.status(err.statusCode).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required.' });
      return;
    }
    const result = await authService.login({ email, password });
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    if (err.statusCode) {
      res.status(err.statusCode).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
}

export async function googleAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const { credential } = req.body;
    const result = await authService.googleAuth({ credential });
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    if (err.statusCode) {
      res.status(err.statusCode).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
}


export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: 'Email address is required.' });
      return;
    }
    const result = await authService.forgotPassword(email);
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    if (err.statusCode) {
      res.status(err.statusCode).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400).json({ success: false, error: 'Reset token and new password are required.' });
      return;
    }
    const result = await authService.resetPassword(token, password);
    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    if (err.statusCode) {
      res.status(err.statusCode).json({ success: false, error: err.message });
      return;
    }
    next(err);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }
    const user = await authService.getUserById(req.user.userId);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}
