export interface WSTickUpdate {
  type: 'PRICE_UPDATE';
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  bid?: number | null;
  ask?: number | null;
  source?: string;
  spreadPips?: number | null;

  timestamp: number;
  candle?: {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  };
  isClosed?: boolean;
}


export type ConnectionStatus = 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED';
