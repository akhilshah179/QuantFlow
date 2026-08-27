import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';

export interface TokenPayload {
  userId: string;
  email: string;
}

export function generateToken(payload: TokenPayload): string {
  const options: SignOptions = { expiresIn: '7d' };
  return jwt.sign(payload, config.jwtSecret, options);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}
