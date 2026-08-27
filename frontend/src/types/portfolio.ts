export type OrderType = 'BUY' | 'SELL';

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export interface PortfolioSummary {
  portfolioId: string;
  totalPortfolioValue: number;
  cashBalance: number;
  investedAmount: number;
  unrealizedPnL: number;
  realizedPnL: number;
  holdings: Holding[];
}

export interface Transaction {
  id: string;
  symbol: string;
  type: OrderType;
  price: number;
  quantity: number;
  totalAmount: number;
  realizedPnL: number;
  createdAt: string;
}
