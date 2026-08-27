import { useEffect } from 'react';
import { useMarketStore } from '../store/marketStore';
import { WSTickUpdate } from '../types/ws';

export function useRealtimeQuote(symbol: string): WSTickUpdate | null {
  const quotes = useMarketStore((state) => state.quotes);
  const subscribeSymbols = useMarketStore((state) => state.subscribeSymbols);

  useEffect(() => {
    if (symbol) {
      subscribeSymbols(symbol);
    }
  }, [symbol, subscribeSymbols]);

  return quotes[symbol?.toUpperCase()] || null;
}
