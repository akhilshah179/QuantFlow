import http from 'http';
import app from './app';
import { config } from './config';
import redisManager from './redis/client';
import { wsServer } from './websocket/server';
import { marketIngestionService } from './services/marketIngestionService';
import { upstoxInstrumentService } from './services/upstoxInstrumentService';

const server = http.createServer(app);

async function startServer() {
  try {
    // Attempt Redis connection
    await redisManager.connect();

    // Attach WebSocket server
    wsServer.initialize(server);

    // Initialize Upstox NSE Instrument Master Data
    await upstoxInstrumentService.init();

    // Initialize Real Market Data Ingestion Engine
    marketIngestionService.initialize();

    server.listen(config.port, '0.0.0.0', () => {
      console.log(`=======================================================`);
      console.log(`🚀 QuantFlow Backend Running on http://localhost:${config.port}`);
      console.log(`📡 WebSocket Gateway Listening at ws://localhost:${config.port}/ws`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to start QuantFlow server:', err);
    process.exit(1);
  }
}

startServer();
