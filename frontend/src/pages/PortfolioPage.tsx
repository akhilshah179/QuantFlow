import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortfolioStore } from '../store/portfolioStore';
import { useMarketStore } from '../store/marketStore';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { Briefcase, Wallet, TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';

export const PortfolioPage: React.FC = () => {
  const navigate = useNavigate();
  const { summary, fetchPortfolio, isLoading } = usePortfolioStore();
  const quotes = useMarketStore((state) => state.quotes);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  if (isLoading || !summary) {
    return (
      <div className="p-8 text-center text-[#707a8a] font-mono animate-pulse">
        Calculating Portfolio Holdings & Performance...
      </div>
    );
  }

  // Recalculate Mark-to-Market Valuation with WebSocket Live Quotes
  let liveHoldingsValue = 0;
  const liveHoldings = summary.holdings.map((h) => {
    const liveTick = quotes[h.symbol];
    const price = liveTick ? liveTick.price : h.currentPrice;
    const val = h.quantity * price;
    const cost = h.quantity * h.averageBuyPrice;
    const pnl = val - cost;
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
    liveHoldingsValue += val;

    return {
      ...h,
      currentPrice: price,
      currentValue: val,
      unrealizedPnL: pnl,
      unrealizedPnLPercent: pnlPct,
    };
  });

  const totalNetWorth = summary.cashBalance + liveHoldingsValue;
  const totalUnrealizedPnL = liveHoldings.reduce((sum, h) => sum + h.unrealizedPnL, 0);
  const isUnrealizedPos = totalUnrealizedPnL >= 0;
  const isRealizedPos = summary.realizedPnL >= 0;

  return (
    <div className="space-y-4 text-[#131722]">
      {/* Header */}
      <div className="bg-white border border-[#e0e3eb] rounded-lg p-4 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold font-mono text-[#131722] flex items-center space-x-2">
            <Briefcase className="w-5 h-5 text-[#2962ff]" />
            <span>Paper Portfolio & Holdings</span>
          </h1>
          <p className="text-xs text-[#707a8a] font-medium mt-0.5">Live mark-to-market performance and equity asset allocation</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center space-x-1.5 text-xs font-mono text-[#707a8a]">
            <PieChart className="w-3.5 h-3.5 text-[#2962ff]" />
            <span>Total Net Worth</span>
          </div>
          <div className="text-xl font-extrabold font-mono text-[#131722] mt-1">
            {formatCurrency(totalNetWorth)}
          </div>
        </div>

        <div className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center space-x-1.5 text-xs font-mono text-[#707a8a]">
            <Wallet className="w-3.5 h-3.5 text-[#089981]" />
            <span>Available Cash</span>
          </div>
          <div className="text-xl font-extrabold font-mono text-[#089981] mt-1">
            {formatCurrency(summary.cashBalance)}
          </div>
        </div>

        <div className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center space-x-1.5 text-xs font-mono text-[#707a8a]">
            <DollarSign className="w-3.5 h-3.5 text-[#707a8a]" />
            <span>Invested Amount</span>
          </div>
          <div className="text-xl font-extrabold font-mono text-[#131722] mt-1">
            {formatCurrency(summary.investedAmount)}
          </div>
        </div>

        <div className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center space-x-1.5 text-xs font-mono text-[#707a8a]">
            {isUnrealizedPos ? <TrendingUp className="w-3.5 h-3.5 text-[#089981]" /> : <TrendingDown className="w-3.5 h-3.5 text-[#f23645]" />}
            <span>Unrealized P/L</span>
          </div>
          <div className={`text-xl font-extrabold font-mono mt-1 ${isUnrealizedPos ? 'text-[#089981]' : 'text-[#f23645]'}`}>
            {isUnrealizedPos ? '+' : ''}{formatCurrency(totalUnrealizedPnL)}
          </div>
        </div>

        <div className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center space-x-1.5 text-xs font-mono text-[#707a8a]">
            {isRealizedPos ? <TrendingUp className="w-3.5 h-3.5 text-[#089981]" /> : <TrendingDown className="w-3.5 h-3.5 text-[#f23645]" />}
            <span>Realized P/L</span>
          </div>
          <div className={`text-xl font-extrabold font-mono mt-1 ${isRealizedPos ? 'text-[#089981]' : 'text-[#f23645]'}`}>
            {isRealizedPos ? '+' : ''}{formatCurrency(summary.realizedPnL)}
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 shadow-xs">
        <h2 className="text-xs font-bold font-mono text-[#131722] mb-3 uppercase tracking-wider border-b border-[#f0f3fa] pb-2">Open Positions</h2>
        {liveHoldings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-[#707a8a] border-b border-[#e0e3eb] uppercase text-[10px]">
                  <th className="pb-2">Symbol</th>
                  <th className="pb-2">Quantity</th>
                  <th className="pb-2">Avg Price</th>
                  <th className="pb-2">Live Price</th>
                  <th className="pb-2">Market Value</th>
                  <th className="pb-2">Unrealized P/L</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f3fa]">
                {liveHoldings.map((h) => {
                  const isPos = h.unrealizedPnL >= 0;
                  return (
                    <tr key={h.id} className="hover:bg-[#f8f9fd] transition-colors">
                      <td className="py-2.5 font-bold text-[#131722] text-xs">{h.symbol}</td>
                      <td className="py-2.5 text-[#131722]">{h.quantity}</td>
                      <td className="py-2.5 text-[#131722]">{formatCurrency(h.averageBuyPrice)}</td>
                      <td className="py-2.5 font-bold text-[#131722]">{formatCurrency(h.currentPrice)}</td>
                      <td className="py-2.5 font-bold text-[#131722]">{formatCurrency(h.currentValue)}</td>
                      <td className="py-2.5">
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${isPos ? 'bg-[#e6f4f1] text-[#089981]' : 'bg-[#fdecee] text-[#f23645]'}`}>
                          {isPos ? '+' : ''}{formatCurrency(h.unrealizedPnL)} ({formatPercent(h.unrealizedPnLPercent)})
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => navigate(`/stocks/${h.symbol}`)}
                          className="bg-[#e8f0fe] hover:bg-[#2962ff] text-[#2962ff] hover:text-white px-2.5 py-1 rounded transition-colors text-[10px] font-bold"
                        >
                          Trade / Analyze
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-[#707a8a] font-mono">
            You currently hold no open stock positions. Use Paper Trading to execute orders.
          </div>
        )}
      </div>
    </div>
  );
};
