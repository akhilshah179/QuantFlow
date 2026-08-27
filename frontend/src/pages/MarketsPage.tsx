import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { MarketOverviewData } from '../types/stock';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';
import { MarketStatusBadge } from '../components/common/MarketStatusBadge';
import { NewsSection } from '../components/news/NewsSection';
import { Globe, TrendingUp, TrendingDown, PieChart, Layers, ShieldAlert } from 'lucide-react';

export const MarketsPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<MarketOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = () => {
    setLoading(true);
    setError(null);
    api.get('/stocks/market/overview')
      .then((res: any) => {
        const overviewObj = res && res.indices ? res : (res?.data || null);
        if (overviewObj) {
          setData(overviewObj);
        } else {
          setError('Global market data is currently unavailable.');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch global market overview.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-[#707a8a] font-mono animate-pulse">
        Loading Global Markets Overview...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center space-y-4 bg-white border border-[#e0e3eb] rounded-lg text-[#131722]">
        <div className="text-[#f23645] font-mono text-xs flex items-center justify-center space-x-2 font-bold">
          <ShieldAlert className="w-4 h-4" />
          <span>{error || 'Global market overview data is currently unavailable.'}</span>
        </div>
        <button
          onClick={fetchOverview}
          className="bg-[#2962ff] hover:bg-[#1e54e4] text-white px-4 py-1.5 rounded text-xs font-mono font-bold transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-[#131722]">
      {/* Title Header */}
      <div className="bg-white border border-[#e0e3eb] rounded-lg p-4 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold font-mono text-[#131722] flex items-center space-x-2">
            <Globe className="w-5 h-5 text-[#2962ff]" />
            <span>Global Markets & Exchange Discovery</span>
          </h1>
          <p className="text-xs text-[#707a8a] mt-0.5 font-medium">Cross-exchange equity tracking across US, Indian & European markets</p>
        </div>
      </div>

      {/* Global Benchmark Indices Grid */}
      <div className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 shadow-xs">
        <h2 className="text-xs font-bold font-mono text-[#131722] mb-3 flex items-center space-x-1.5 uppercase tracking-wider border-b border-[#f0f3fa] pb-2">
          <Globe className="w-4 h-4 text-[#089981]" />
          <span>Major Global Benchmark Indices</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.indices.map((idx) => {
            const isUp = idx.change >= 0;
            return (
              <div
                key={idx.symbol}
                className="bg-[#f8f9fd] border border-[#e0e3eb] rounded-lg p-3 flex flex-col justify-between hover:border-[#2962ff] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#131722]">{idx.name} ({idx.symbol})</span>
                  <MarketStatusBadge status={idx.marketStatus} />
                </div>
                <div className="mt-2.5 flex items-baseline justify-between">
                  <span className="text-xl font-extrabold font-mono text-[#131722]">
                    {idx.value.toLocaleString()}
                  </span>
                  <div className={`flex items-center space-x-0.5 font-mono text-xs font-bold px-1.5 py-0.5 rounded ${isUp ? 'bg-[#e6f4f1] text-[#089981]' : 'bg-[#fdecee] text-[#f23645]'}`}>
                    {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{isUp ? '+' : ''}{idx.change.toFixed(2)}</span>
                    <span>({formatPercent(idx.changePercent)})</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Industry Sector Relative Performance Grid */}
      <div className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 shadow-xs">
        <h2 className="text-xs font-bold font-mono text-[#131722] mb-3 flex items-center space-x-1.5 uppercase tracking-wider border-b border-[#f0f3fa] pb-2">
          <PieChart className="w-4 h-4 text-[#f5a623]" />
          <span>Industry Sector Relative Performance</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {data.sectorPerformance.map((sec) => {
            const isUp = sec.changePercent >= 0;
            return (
              <div
                key={sec.sector}
                className="bg-[#f8f9fd] border border-[#e0e3eb] rounded-lg p-2.5 text-center"
              >
                <div className="text-[11px] text-[#707a8a] font-mono font-medium truncate">{sec.sector}</div>
                <div className={`text-base font-bold font-mono mt-0.5 ${isUp ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                  {isUp ? '+' : ''}{sec.changePercent.toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cross-Exchange Equities Table */}
      <div className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 shadow-xs">
        <h2 className="text-xs font-bold font-mono text-[#131722] mb-3 flex items-center space-x-1.5 uppercase tracking-wider border-b border-[#f0f3fa] pb-2">
          <Layers className="w-4 h-4 text-[#2962ff]" />
          <span>Active Cross-Border Stocks</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="text-[#707a8a] border-b border-[#e0e3eb] uppercase text-[10px]">
                <th className="pb-2">Symbol</th>
                <th className="pb-2">Exchange</th>
                <th className="pb-2">Sector</th>
                <th className="pb-2">Price</th>
                <th className="pb-2">24h Change</th>
                <th className="pb-2">Market Cap</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f3fa]">
              {data.mostActive.map((stock) => {
                const isUp = stock.change >= 0;
                return (
                  <tr key={stock.symbol} className="hover:bg-[#f8f9fd] transition-colors">
                    <td className="py-2.5 font-bold text-[#131722]">{stock.symbol}</td>
                    <td className="py-2.5 text-[#707a8a]">{stock.exchange}</td>
                    <td className="py-2.5 text-[#131722]">{stock.sector || 'General'}</td>
                    <td className="py-2.5 font-bold text-[#131722]">{formatCurrency(stock.price, stock.currency)}</td>
                    <td className="py-2.5">
                      <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${isUp ? 'bg-[#e6f4f1] text-[#089981]' : 'bg-[#fdecee] text-[#f23645]'}`}>
                        {isUp ? '+' : ''}{stock.change.toFixed(2)} ({formatPercent(stock.changePercent)})
                      </span>
                    </td>
                    <td className="py-2.5 text-[#131722]">{stock.marketCap ? formatNumber(stock.marketCap) : 'N/A'}</td>
                    <td className="py-2.5">
                      <MarketStatusBadge status={stock.marketStatus} />
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => navigate(`/stocks/${stock.symbol}`)}
                        className="bg-[#e8f0fe] hover:bg-[#2962ff] text-[#2962ff] hover:text-white px-2.5 py-1 rounded transition-colors text-[10px] font-bold"
                      >
                        Terminal View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Financial News Feed */}
      <NewsSection limit={6} />
    </div>
  );
};
