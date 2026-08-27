import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/quantflow?schema=public',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_quantflow_jwt_key_2026',
  jwtExpiresIn: '7d',
  get corsOrigin() {
    dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
    return (process.env.CORS_ORIGIN || 'http://localhost:5174,http://localhost:5173,http://localhost:3000').split(',');
  },
  marketDataProvider: process.env.MARKET_DATA_PROVIDER || 'real',
  marketDataApiKey: process.env.FINNHUB_API_KEY || process.env.MARKET_DATA_API_KEY || '',
  finnhubApiKey: process.env.FINNHUB_API_KEY || process.env.MARKET_DATA_API_KEY || '',
  upstoxApiKey: process.env.UPSTOX_API_KEY || '',
  upstoxAccessToken: process.env.UPSTOX_ACCESS_TOKEN || '',
  newsApiKey: process.env.NEWS_API_KEY || '',
  binanceApiKey: process.env.BINANCE_API_KEY || '',
  binanceApiSecret: process.env.BINANCE_API_SECRET || '',
  coingeckoApiKey: process.env.COINGECKO_API_KEY || '',

  get googleClientId(): string {
    dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
    return (this as any)._googleClientId ?? (process.env.GOOGLE_CLIENT_ID || '');
  },
  set googleClientId(val: string) {
    (this as any)._googleClientId = val;
  },
  get googleClientSecret(): string {
    dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
    return (this as any)._googleClientSecret ?? (process.env.GOOGLE_CLIENT_SECRET || '');
  },
  set googleClientSecret(val: string) {
    (this as any)._googleClientSecret = val;
  },
};
