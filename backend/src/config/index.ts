import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/quantflow?schema=public',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_quantflow_jwt_key_2026',
  jwtExpiresIn: '7d',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000').split(','),
  marketDataProvider: process.env.MARKET_DATA_PROVIDER || 'real',
  marketDataApiKey: process.env.FINNHUB_API_KEY || process.env.MARKET_DATA_API_KEY || '',
  finnhubApiKey: process.env.FINNHUB_API_KEY || process.env.MARKET_DATA_API_KEY || '',
  upstoxApiKey: process.env.UPSTOX_API_KEY || '',
  upstoxAccessToken: process.env.UPSTOX_ACCESS_TOKEN || '',
  newsApiKey: process.env.NEWS_API_KEY || '',
};

