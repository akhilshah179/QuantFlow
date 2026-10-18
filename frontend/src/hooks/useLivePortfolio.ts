import { useEffect, useMemo } from 'react';
import { usePortfolioStore } from '../store/portfolioStore';
import { useMarketStore } from '../store/marketStore';
import { Holding } from '../types/portfolio';
import { subscribeOnce } from '../components/stream/useStreamData';

export interface LivePortfolio {
  liveHoldings: Holding[];
  liveHoldingsValue: number;
  totalNetWorth: number;
  totalUnrealizedPnL: number;
  totalCost: number;
}

/**
 * Mark-to-market the paper portfolio against live ticks. The store selector
 * returns a compact price key, so only ticks for held symbols re-render callers.
 */
export function useLivePortfolio(): LivePortfolio | null {
  const summary = usePortfolioStore((s) => s.summary);
  const symbols = useMemo(() => summary?.holdings.map((h) => h.symbol) ?? [], [summary]);
  const priceKey = useMarketStore((s) => symbols.map((sym) => s.quotes[sym]?.price ?? '').join('|'));

  useEffect(() => {
    if (symbols.length) subscribeOnce(symbols);
  }, [symbols]);

  return useMemo(() => {
    if (!summary) return null;
    const quotes = useMarketStore.getState().quotes;

    // Recalculate Mark-to-Market Valuation with WebSocket Live Quotes
    let liveHoldingsValue = 0;
    let totalCost = 0;
    const liveHoldings = summary.holdings.map((h) => {
      const liveTick = quotes[h.symbol];
      const price = liveTick ? liveTick.price : h.currentPrice;
      const val = h.quantity * price;
      const cost = h.quantity * h.averageBuyPrice;
      const pnl = val - cost;
      const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
      liveHoldingsValue += val;
      totalCost += cost;

      return {
        ...h,
        currentPrice: price,
        currentValue: val,
        unrealizedPnL: pnl,
        unrealizedPnLPercent: pnlPct,
      };
    });

    return {
      liveHoldings,
      liveHoldingsValue,
      totalCost,
      totalNetWorth: summary.cashBalance + liveHoldingsValue,
      totalUnrealizedPnL: liveHoldings.reduce((sum, h) => sum + h.unrealizedPnL, 0),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary, priceKey]);
}
