import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/authRoutes';
import stockRoutes from './routes/stockRoutes';
import watchlistRoutes from './routes/watchlistRoutes';
import paperTradingRoutes from './routes/paperTradingRoutes';
import newsRoutes from './routes/newsRoutes';
import cryptoRoutes from './routes/cryptoRoutes';
import forexRoutes from './routes/forexRoutes';
import futuresRoutes from './routes/futuresRoutes';
import calendarRoutes from './routes/calendarRoutes';
import communityRoutes from './routes/communityRoutes';
import alertsRoutes from './routes/alertsRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

app.use(express.json());

// API Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'QuantFlow Multi-Asset Terminal Engine',
  });
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/watchlists', watchlistRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/crypto', cryptoRoutes);
app.use('/api/forex', forexRoutes);
app.use('/api/futures', futuresRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api', paperTradingRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
