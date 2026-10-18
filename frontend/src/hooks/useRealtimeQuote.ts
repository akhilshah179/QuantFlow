import { useEffect } from 'react';
import { useMarketStore } from '../store/marketStore';
import { WSTickUpdate } from '../types/ws';

export function useRealtimeQuote(symbol: string): WSTickUpdate | null {
  // Select only this symbol's quote so unrelated ticks don't re-render the caller.
  const quote = useMarketStore((state) => (symbol ? state.quotes[symbol.toUpperCase()] : undefined));
  const subscribeSymbols = useMarketStore((state) => state.subscribeSymbols);

  useEffect(() => {
    if (symbol) {
      subscribeSymbols(symbol);
    }
  }, [symbol, subscribeSymbols]);

  return quote || null;
}
