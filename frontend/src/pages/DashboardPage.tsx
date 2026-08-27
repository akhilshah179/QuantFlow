import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { MarketOverviewData } from '../types/stock';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';
import { useMarketStore } from '../store/marketStore';
import { TrendingUp, TrendingDown, Activity, Eye, Globe2, BarChart3, ShieldAlert } from 'lucide-react';
import { NewsSection } from '../components/news/NewsSection';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<MarketOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const quotes = useMarketStore((state) => state.quotes);

  useEffect(() => {
    api.get('/stocks/market/overview')
      .then((res: any) => {
        const overviewObj = res && res.indices ? res : (res?.data || null);
        setData(overviewObj);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-[#707a8a] font-mono animate-pulse">
        Loading TradingView Financial Terminal Overview...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center space-y-4 bg-white border border-[#e0e3eb] rounded-lg">
        <div className="text-[#f23645] font-mono text-xs flex items-center justify-center space-x-2 font-bold">
          <ShieldAlert className="w-4 h-4" />
          <span>Market overview data currently unavailable.</span>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            api.get('/stocks/market/overview').then((res: any) => {
              const overviewObj = res && res.indices ? res : (res?.data || null);
              setData(overviewObj);
              setLoading(false);
            }).catch(() => setLoading(false));
          }}
          className="bg-[#2962ff] hover:bg-[#1e54e4] text-white px-4 py-1.5 rounded text-xs font-mono font-bold transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-[#131722]">
      {/* Page Banner Header */}
      <div className="bg-white border border-[#e0e3eb] rounded-lg p-4 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold font-mono text-[#131722] flex items-center space-x-2">
            <Globe2 className="w-5 h-5 text-[#2962ff]" />
            <span>Global Market Overview</span>
          </h1>
          <p className="text-xs text-[#707a8a] mt-0.5 font-medium">Real-time market indices, equity movers, volume statistics and financial intelligence</p>
        </div>
        <div className="hidden sm:flex items-center space-x-2">
          <span className="text-xs font-mono font-semibold text-[#707a8a]">MARKET STATUS:</span>
          <span className="text-xs font-mono font-bold text-[#089981] bg-[#e6f4f1] px-2 py-0.5 rounded">OPEN</span>
        </div>
      </div>

      {/* Major Indices Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {data.indices.map((idx) => {
          const isUp = idx.change >= 0;
          return (
            <div
              key={idx.symbol}
              className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 hover:border-[#2962ff] transition-colors shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#707a8a]">{idx.symbol}</span>
                <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${isUp ? 'bg-[#e6f4f1] text-[#089981]' : 'bg-[#fdecee] text-[#f23645]'}`}>
                  {formatPercent(idx.changePercent)}
                </span>
              </div>
              <div className="text-xs font-bold text-[#131722] mt-1 truncate">{idx.name}</div>
              <div className="text-xl font-extrabold font-mono text-[#131722] mt-1">
                {idx.value.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Market Movers Grid: Top Gainers & Top Decliners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Gainers */}
        <div className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-[#f0f3fa] pb-2">
            <h2 className="text-xs font-bold font-mono text-[#131722] flex items-center space-x-1.5 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-[#089981]" />
              <span>Top Market Gainers</span>
            </h2>
            <span className="text-[10px] font-mono text-[#707a8a]">REALTIME</span>
          </div>
          <div className="divide-y divide-[#f0f3fa]">
            {data.topGainers.map((stock) => {
              const liveTick = quotes[stock.symbol];
              const price = liveTick ? liveTick.price : stock.price;
              const changePercent = liveTick ? liveTick.changePercent : stock.changePercent;
              return (
                <div
                  key={stock.symbol}
                  onClick={() => navigate(`/stocks/${stock.symbol}`)}
                  className="py-2 flex items-center justify-between hover:bg-[#f8f9fd] px-2 rounded cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-mono font-bold text-xs text-[#131722]">{stock.symbol}</div>
                    <div className="text-[11px] text-[#707a8a] truncate max-w-[180px] font-medium">{stock.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-[#131722]">{formatCurrency(price, stock.currency)}</div>
                    <div className="font-mono text-[11px] text-[#089981] font-bold">
                      +{changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Losers */}
        <div className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-[#f0f3fa] pb-2">
            <h2 className="text-xs font-bold font-mono text-[#131722] flex items-center space-x-1.5 uppercase tracking-wider">
              <TrendingDown className="w-4 h-4 text-[#f23645]" />
              <span>Top Market Decliners</span>
            </h2>
            <span className="text-[10px] font-mono text-[#707a8a]">REALTIME</span>
          </div>
          <div className="divide-y divide-[#f0f3fa]">
            {data.topLosers.map((stock) => {
              const liveTick = quotes[stock.symbol];
              const price = liveTick ? liveTick.price : stock.price;
              const changePercent = liveTick ? liveTick.changePercent : stock.changePercent;
              return (
                <div
                  key={stock.symbol}
                  onClick={() => navigate(`/stocks/${stock.symbol}`)}
                  className="py-2 flex items-center justify-between hover:bg-[#f8f9fd] px-2 rounded cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-mono font-bold text-xs text-[#131722]">{stock.symbol}</div>
                    <div className="text-[11px] text-[#707a8a] truncate max-w-[180px] font-medium">{stock.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-xs text-[#131722]">{formatCurrency(price, stock.currency)}</div>
                    <div className="font-mono text-[11px] text-[#f23645] font-bold">
                      {changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Most Active Stocks Table */}
      <div className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-[#f0f3fa] pb-2">
          <h2 className="text-xs font-bold font-mono text-[#131722] flex items-center space-x-1.5 uppercase tracking-wider">
            <Eye className="w-4 h-4 text-[#2962ff]" />
            <span>Most Active Volume Equities</span>
          </h2>
          <span className="text-[10px] font-mono text-[#707a8a]">LIVE ORDER FLOW</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="text-[#707a8a] border-b border-[#e0e3eb] uppercase text-[10px]">
                <th className="pb-2">Symbol</th>
                <th className="pb-2">Name</th>
                <th className="pb-2">Price</th>
                <th className="pb-2">Change %</th>
                <th className="pb-2">Volume</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f3fa]">
              {data.mostActive.map((stock) => {
                const liveTick = quotes[stock.symbol];
                const price = liveTick ? liveTick.price : stock.price;
                const changePercent = liveTick ? liveTick.changePercent : stock.changePercent;
                const isUp = changePercent >= 0;
                return (
                  <tr key={stock.symbol} className="hover:bg-[#f8f9fd] transition-colors">
                    <td className="py-2.5 font-bold text-[#131722]">{stock.symbol}</td>
                    <td className="py-2.5 text-[#707a8a] font-medium">{stock.name}</td>
                    <td className="py-2.5 text-[#131722] font-bold">{formatCurrency(price, stock.currency)}</td>
                    <td className="py-2.5">
                      <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${isUp ? 'bg-[#e6f4f1] text-[#089981]' : 'bg-[#fdecee] text-[#f23645]'}`}>
                        {formatPercent(changePercent)}
                      </span>
                    </td>
                    <td className="py-2.5 text-[#131722] font-medium">{formatNumber(liveTick ? liveTick.volume : stock.volume)}</td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => navigate(`/stocks/${stock.symbol}`)}
                        className="bg-[#e8f0fe] hover:bg-[#2962ff] text-[#2962ff] hover:text-white px-2.5 py-1 rounded transition-colors text-[10px] font-bold"
                      >
                        Analyze Chart
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial News Section */}
      <NewsSection limit={6} />
    </div>
  );
};
