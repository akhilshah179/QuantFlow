export interface WSTickUpdate {
  type: 'PRICE_UPDATE';
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketStatus?: string;
  dataQuality?: string;
  isMock?: boolean;
  timestamp: number;
}

export type ConnectionStatus = 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED';
