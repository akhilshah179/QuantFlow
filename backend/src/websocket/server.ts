import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from '../utils/jwt';
import redisManager from '../redis/client';
import { WSTickUpdate } from '../types/ws';
import { marketIngestionService } from '../services/marketIngestionService';

interface ClientState {
  ws: WebSocket;
  userId?: string;
  subscribedSymbols: Set<string>;
  isAlive: boolean;
}

export class QuantFlowWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, ClientState> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  public initialize(server: HTTPServer): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    console.log('[WebSocket] QuantFlow WebSocket Gateway initialized on path /ws');

    // Subscribe to Redis Pub/Sub for real-time market event distribution
    redisManager.psubscribe('market:events:*', (_pattern, channel, message) => {
      try {
        const tick: WSTickUpdate = JSON.parse(message);
        const symbol = tick.symbol.toUpperCase();
        this.broadcastTickToSubscribers(symbol, tick);
      } catch {
        // Ignore non-JSON
      }
    });

    this.wss.on('connection', (ws: WebSocket, req) => {
      const state: ClientState = {
        ws,
        subscribedSymbols: new Set(['AAPL', 'TSLA', 'NVDA', 'MSFT']), // Default initial symbols
        isAlive: true,
      };

      const urlParams = new URLSearchParams(req.url?.split('?')[1] || '');
      const token = urlParams.get('token');
      if (token) {
        try {
          const payload = verifyToken(token);
          state.userId = payload.userId;
        } catch {
          // Token invalid, proceed unauthenticated
        }
      }

      this.clients.set(ws, state);

      // Send initial welcome & connection ack
      this.sendToClient(ws, {
        type: 'CONNECTED',
        message: 'Connected to QuantFlow Real-Time Market Feed',
        subscriptions: Array.from(state.subscribedSymbols),
      });

      // Send latest quotes for subscribed symbols upon initial connection
      state.subscribedSymbols.forEach(async (sym) => {
        marketIngestionService.subscribeSymbol(sym);
        const quote = await marketIngestionService.getLatestQuote(sym);
        if (quote) {
          this.sendToClient(ws, {
            type: 'PRICE_UPDATE',
            symbol: quote.symbol,
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            volume: quote.volume,
            bid: quote.bid,
            ask: quote.ask,
            source: (quote as any).source,
            spreadPips: (quote as any).spreadPips,
            marketStatus: quote.marketStatus,
            dataQuality: quote.dataQuality,
            isMock: quote.isMock,
            timestamp: Math.floor(quote.timestamp / 1000),
          });
        }
      });

      ws.on('message', (message: string) => {
        this.handleClientMessage(ws, state, message);
      });

      ws.on('pong', () => {
        state.isAlive = true;
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('error', () => {
        this.clients.delete(ws);
      });
    });

    // Start 30s Heartbeat Ping-Pong to detect broken connections
    this.pingInterval = setInterval(() => {
      this.clients.forEach((state, ws) => {
        if (!state.isAlive) {
          ws.terminate();
          this.clients.delete(ws);
          return;
        }
        state.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  private handleClientMessage(ws: WebSocket, state: ClientState, rawMessage: string): void {
    try {
      const data = JSON.parse(rawMessage.toString());
      if (!data.action) return;

      const symbol = data.symbol ? data.symbol.toUpperCase() : null;

      switch (data.action) {
        case 'SUBSCRIBE':
          if (symbol) {
            state.subscribedSymbols.add(symbol);
            marketIngestionService.subscribeSymbol(symbol);
            this.sendToClient(ws, {
              type: 'SUBSCRIBED',
              symbol,
              subscriptions: Array.from(state.subscribedSymbols),
            });
            // Send current quote immediately
            marketIngestionService.getLatestQuote(symbol).then((quote) => {
              if (quote) {
                this.sendToClient(ws, {
                  type: 'PRICE_UPDATE',
                  symbol: quote.symbol,
                  price: quote.price,
                  change: quote.change,
                  changePercent: quote.changePercent,
                  volume: quote.volume,
                  bid: quote.bid,
                  ask: quote.ask,
                  source: (quote as any).source,
                  spreadPips: (quote as any).spreadPips,
                  marketStatus: quote.marketStatus,
                  dataQuality: quote.dataQuality,
                  isMock: quote.isMock,
                  timestamp: Math.floor(quote.timestamp / 1000),
                });
              }
            });
          }
          break;

        case 'UNSUBSCRIBE':
          if (symbol) {
            state.subscribedSymbols.delete(symbol);
            this.sendToClient(ws, {
              type: 'UNSUBSCRIBED',
              symbol,
              subscriptions: Array.from(state.subscribedSymbols),
            });
          }
          break;

        case 'PING':
          this.sendToClient(ws, { type: 'PONG', timestamp: Date.now() });
          break;
      }
    } catch {
      // Ignore invalid JSON
    }
  }

  private broadcastTickToSubscribers(symbol: string, tick: any): void {
    this.clients.forEach((state, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        const isSubscribed = Array.from(state.subscribedSymbols).some((sub) => {
          const subUpper = sub.toUpperCase();
          const symUpper = symbol.toUpperCase();
          return subUpper === symUpper || subUpper.split(':')[0] === symUpper.split(':')[0];
        });

        if (isSubscribed) {
          this.sendToClient(ws, tick);
        }
      }
    });
  }

  private sendToClient(ws: WebSocket, payload: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  public shutdown(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.wss) {
      this.wss.close();
    }
  }
}

export const wsServer = new QuantFlowWebSocketServer();
