import React, { useEffect, useState } from 'react';
import { usePortfolioStore } from '../store/portfolioStore';
import { QuickTradePanel } from '../components/trading/QuickTradePanel';
import { useRealtimeQuote } from '../hooks/useRealtimeQuote';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { DollarSign, History, Layers } from 'lucide-react';
import api from '../services/api';

export const PaperTradingPage: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('AAPL');
  const [stockQuote, setStockQuote] = useState<any>(null);

  const { summary, transactions, fetchPortfolio, fetchTransactions } = usePortfolioStore();
  const realtimeTick = useRealtimeQuote(selectedSymbol);

  useEffect(() => {
    fetchPortfolio();
    fetchTransactions();
  }, [fetchPortfolio, fetchTransactions]);

  useEffect(() => {
    api.get(`/stocks/${selectedSymbol}`)
      .then((res: any) => setStockQuote(res?.price !== undefined ? res : (res?.data || null)))
      .catch(() => {});
  }, [selectedSymbol]);

  const currentPrice = realtimeTick ? realtimeTick.price : stockQuote ? stockQuote.price : 100;

  return (
    <div className="space-y-4 text-[#131722]">
      {/* Title Header */}
      <div className="bg-white border border-[#e0e3eb] rounded-lg p-4 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold font-mono text-[#131722] flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-[#089981]" />
            <span>Paper Trading Order Terminal</span>
          </h1>
          <p className="text-xs text-[#707a8a] font-medium mt-0.5">Execute simulated market orders with zero financial risk</p>
        </div>
      </div>

      {/* Main Grid: Order Form + Positions & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Col: Stock Selector & Order Entry */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 shadow-xs">
            <label className="block text-[10px] font-mono font-bold uppercase text-[#707a8a] mb-1">
              Select Trading Symbol
            </label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded px-3 py-1.5 text-xs font-mono font-bold text-[#131722] focus:outline-none focus:border-[#2962ff]"
            >
              <option value="AAPL">AAPL - Apple Inc.</option>
              <option value="TSLA">TSLA - Tesla, Inc.</option>
              <option value="NVDA">NVDA - NVIDIA Corp.</option>
              <option value="MSFT">MSFT - Microsoft Corp.</option>
              <option value="EURUSD">EUR/USD - Euro / US Dollar (Forex)</option>
              <option value="GBPUSD">GBP/USD - British Pound / US Dollar (Forex)</option>
              <option value="USDJPY">USD/JPY - US Dollar / Japanese Yen (Forex)</option>
              <option value="USDCHF">USD/CHF - US Dollar / Swiss Franc (Forex)</option>
              <option value="AUDUSD">AUD/USD - Australian Dollar / US Dollar (Forex)</option>
              <option value="USDCAD">USD/CAD - US Dollar / Canadian Dollar (Forex)</option>
              <option value="NZDUSD">NZD/USD - NZ Dollar / US Dollar (Forex)</option>
              <option value="USDINR">USD/INR - US Dollar / Indian Rupee (Forex)</option>
              <option value="BTCUSD">BTC/USDT - Bitcoin (Crypto)</option>
              <option value="ETHUSD">ETH/USDT - Ethereum (Crypto)</option>
              <option value="RELIANCE">RELIANCE - Reliance Industries</option>
              <option value="TCS">TCS - Tata Consultancy</option>
              <option value="INFY">INFY - Infosys Limited</option>
            </select>

          </div>

          <QuickTradePanel symbol={selectedSymbol} currentPrice={currentPrice} />
        </div>

        {/* Right Col: Positions & History */}
        <div className="lg:col-span-2 space-y-4">
          {/* Active Positions */}
          <div className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 shadow-xs">
            <h2 className="text-xs font-bold font-mono text-[#131722] flex items-center space-x-1.5 mb-3 uppercase tracking-wider border-b border-[#f0f3fa] pb-2">
              <Layers className="w-4 h-4 text-[#2962ff]" />
              <span>Current Open Positions</span>
            </h2>

            {summary && summary.holdings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-[#707a8a] border-b border-[#e0e3eb] uppercase text-[10px]">
                      <th className="pb-2">Symbol</th>
                      <th className="pb-2">Qty</th>
                      <th className="pb-2">Avg Price</th>
                      <th className="pb-2">Current Value</th>
                      <th className="pb-2">Unrealized P/L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f3fa]">
                    {summary.holdings.map((h) => {
                      const isPos = h.unrealizedPnL >= 0;
                      return (
                        <tr key={h.id} className="hover:bg-[#f8f9fd] transition-colors">
                          <td className="py-2.5 font-bold text-[#131722]">{h.symbol}</td>
                          <td className="py-2.5 text-[#131722]">{h.quantity}</td>
                          <td className="py-2.5 text-[#131722]">{formatCurrency(h.averageBuyPrice)}</td>
                          <td className="py-2.5 text-[#131722] font-bold">{formatCurrency(h.currentValue)}</td>
                          <td className="py-2.5">
                            <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${isPos ? 'bg-[#e6f4f1] text-[#089981]' : 'bg-[#fdecee] text-[#f23645]'}`}>
                              {isPos ? '+' : ''}{formatCurrency(h.unrealizedPnL)} ({formatPercent(h.unrealizedPnLPercent)})
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-[#707a8a] font-mono text-xs">
                No active positions. Execute a BUY order to open a position.
              </div>
            )}
          </div>

          {/* Transaction History Log */}
          <div className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 shadow-xs">
            <h2 className="text-xs font-bold font-mono text-[#131722] flex items-center space-x-1.5 mb-3 uppercase tracking-wider border-b border-[#f0f3fa] pb-2">
              <History className="w-4 h-4 text-[#f5a623]" />
              <span>Execution Transaction Log</span>
            </h2>

            {transactions && transactions.length > 0 ? (
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-[#707a8a] border-b border-[#e0e3eb] uppercase text-[10px] sticky top-0 bg-white">
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Symbol</th>
                      <th className="pb-2">Price</th>
                      <th className="pb-2">Qty</th>
                      <th className="pb-2">Total Value</th>
                      <th className="pb-2">Realized P/L</th>
                      <th className="pb-2 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f3fa]">
                    {transactions.map((tx) => {
                      const isBuy = tx.type === 'BUY';
                      return (
                        <tr key={tx.id} className="hover:bg-[#f8f9fd] transition-colors">
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${isBuy ? 'bg-[#e6f4f1] text-[#089981]' : 'bg-[#fdecee] text-[#f23645]'}`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-2.5 font-bold text-[#131722]">{tx.symbol}</td>
                          <td className="py-2.5 text-[#131722]">{formatCurrency(tx.price)}</td>
                          <td className="py-2.5 text-[#131722]">{tx.quantity}</td>
                          <td className="py-2.5 text-[#131722] font-bold">{formatCurrency(tx.totalAmount)}</td>
                          <td className={`py-2.5 font-bold ${tx.realizedPnL >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                            {tx.type === 'SELL' ? (tx.realizedPnL >= 0 ? `+${formatCurrency(tx.realizedPnL)}` : formatCurrency(tx.realizedPnL)) : '-'}
                          </td>
                          <td className="py-2.5 text-right text-[#707a8a]">
                            {new Date(tx.createdAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-[#707a8a] font-mono text-xs">
                No orders executed yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
