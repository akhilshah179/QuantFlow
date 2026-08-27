import { WSTickUpdate, ConnectionStatus } from '../types/ws';

type TickCallback = (tick: WSTickUpdate) => void;
type StatusCallback = (status: ConnectionStatus) => void;

export class QuantFlowWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private subscribedSymbols: Set<string> = new Set(['AAPL', 'TSLA', 'NVDA', 'MSFT']);
  private tickCallbacks: Set<TickCallback> = new Set();
  private statusCallbacks: Set<StatusCallback> = new Set();
  private status: ConnectionStatus = 'DISCONNECTED';
  private reconnectAttempts = 0;
  private maxReconnectDelay = 15000;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;

  constructor() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const isDev = window.location.port === '5173' || window.location.hostname === 'localhost';
    const host = isDev ? '127.0.0.1:5000' : window.location.host;
    this.url = `${protocol}//${host}/ws`;
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    const token = localStorage.getItem('quantflow_token');
    const wsUrl = token ? `${this.url}?token=${encodeURIComponent(token)}` : this.url;

    try {
      this.updateStatus('RECONNECTING');
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.updateStatus('CONNECTED');
        this.startHeartbeat();

        // Restore symbol subscriptions automatically upon reconnect
        if (this.subscribedSymbols.size > 0) {
          this.subscribedSymbols.forEach((sym) => {
            this.send({ action: 'SUBSCRIBE', symbol: sym });
          });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'PONG') {
            return;
          }

          if (data.type === 'PRICE_UPDATE') {
            const tick: WSTickUpdate = {
              type: 'PRICE_UPDATE',
              symbol: data.symbol,
              price: data.price,
              change: data.change,
              changePercent: data.changePercent,
              volume: data.volume,
              bid: data.bid,
              ask: data.ask,
              source: data.source,
              spreadPips: data.spreadPips,
              timestamp: data.timestamp,
              candle: data.candle,
              isClosed: data.isClosed,
            };
            this.tickCallbacks.forEach((cb) => cb(tick));
          }

        } catch {
          // Ignore non-JSON
        }
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.updateStatus('DISCONNECTED');
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.stopHeartbeat();
        this.updateStatus('DISCONNECTED');
      };
    } catch {
      this.stopHeartbeat();
      this.updateStatus('DISCONNECTED');
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
    this.updateStatus('DISCONNECTED');
  }

  public subscribe(symbol: string): void {
    const upper = symbol.toUpperCase();
    this.subscribedSymbols.add(upper);
    if (this.status === 'CONNECTED') {
      this.send({ action: 'SUBSCRIBE', symbol: upper });
    }
  }

  public unsubscribe(symbol: string): void {
    const upper = symbol.toUpperCase();
    this.subscribedSymbols.delete(upper);
    if (this.status === 'CONNECTED') {
      this.send({ action: 'UNSUBSCRIBE', symbol: upper });
    }
  }

  public onTick(callback: TickCallback): () => void {
    this.tickCallbacks.add(callback);
    return () => this.tickCallbacks.delete(callback);
  }

  public onStatusChange(callback: StatusCallback): () => void {
    this.statusCallbacks.add(callback);
    callback(this.status);
    return () => this.statusCallbacks.delete(callback);
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private updateStatus(newStatus: ConnectionStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusCallbacks.forEach((cb) => cb(newStatus));
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.status === 'CONNECTED') {
        this.send({ action: 'PING' });
      }
    }, 25000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}

export const wsClient = new QuantFlowWebSocketClient();
