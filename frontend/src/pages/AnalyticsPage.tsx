import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { MarketOverviewData, StockQuote } from '../types/stock';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';
import { BarChart3, PieChart, Activity } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<MarketOverviewData | null>(null);
  const [screenerData, setScreenerData] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/stocks/market/overview'),
      api.get('/stocks/screener'),
    ])
      .then(([overviewRes, screenerRes]: [any, any]) => {
        const overviewObj = overviewRes?.indices ? overviewRes : (overviewRes?.data || null);
        const screenerArr = Array.isArray(screenerRes) ? screenerRes : (screenerRes?.data || []);
        setData(overviewObj);
        setScreenerData(screenerArr);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-[#707a8a] font-mono animate-pulse">
        Generating Fundamental Market Analytics...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-[#707a8a] font-mono bg-white border border-[#e0e3eb] rounded-lg">
        Fundamental market analytics data is currently unavailable.
      </div>
    );
  }

  return (
    <div className="space-y-4 text-[#131722]">
      {/* Title Header */}
      <div className="bg-white border border-[#e0e3eb] rounded-lg p-4 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold font-mono text-[#131722] flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-[#2962ff]" />
            <span>Fundamental Analytics & Valuation Engine</span>
          </h1>
          <p className="text-xs text-[#707a8a] font-medium mt-0.5">Cross-sector capital allocation, valuation multiples & beta distribution</p>
        </div>
      </div>

      {/* Sector Relative Performance */}
      <div className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 shadow-xs">
        <h2 className="text-xs font-bold font-mono text-[#131722] mb-3 flex items-center space-x-1.5 uppercase tracking-wider border-b border-[#f0f3fa] pb-2">
          <PieChart className="w-4 h-4 text-[#089981]" />
          <span>Sector Capital Allocation & Performance</span>
        </h2>
        {data.sectorPerformance && data.sectorPerformance.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {data.sectorPerformance.map((sec) => {
              const isUp = sec.changePercent >= 0;
              return (
                <div key={sec.sector} className="bg-[#f8f9fd] border border-[#e0e3eb] p-3 rounded-lg font-mono">
                  <div className="text-xs text-[#707a8a] font-medium truncate">{sec.sector}</div>
                  <div className={`text-lg font-extrabold mt-1 ${isUp ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                    {isUp ? '+' : ''}{sec.changePercent.toFixed(2)}%
                  </div>
                  <div className="w-full bg-[#e0e3eb] h-1.5 rounded-full mt-2.5 overflow-hidden">
                    <div
                      className={`h-full ${isUp ? 'bg-[#089981]' : 'bg-[#f23645]'}`}
                      style={{ width: `${Math.min(100, Math.abs(sec.changePercent) * 40)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-[#707a8a] font-mono p-4 bg-[#f8f9fd] rounded border border-[#e0e3eb] text-center">
            Sector relative performance data is currently unavailable.
          </div>
        )}
      </div>

      {/* Fundamental Valuation Table */}
      <div className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 shadow-xs">
        <h2 className="text-xs font-bold font-mono text-[#131722] mb-3 flex items-center space-x-1.5 uppercase tracking-wider border-b border-[#f0f3fa] pb-2">
          <Activity className="w-4 h-4 text-[#f5a623]" />
          <span>Top Equities Valuation & Beta Matrix</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="text-[#707a8a] border-b border-[#e0e3eb] uppercase text-[10px]">
                <th className="pb-2">Symbol</th>
                <th className="pb-2">Company</th>
                <th className="pb-2">Market Cap</th>
                <th className="pb-2">P/E Ratio</th>
                <th className="pb-2">EPS</th>
                <th className="pb-2">Dividend Yield</th>
                <th className="pb-2">Beta (Risk)</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f3fa]">
              {screenerData.slice(0, 10).map((stock) => (
                <tr key={stock.symbol} className="hover:bg-[#f8f9fd] transition-colors">
                  <td className="py-2.5 font-bold text-[#131722]">{stock.symbol}</td>
                  <td className="py-2.5 text-[#707a8a] max-w-xs truncate font-medium">{stock.name}</td>
                  <td className="py-2.5 text-[#131722] font-bold">{stock.marketCap ? formatNumber(stock.marketCap) : 'N/A'}</td>
                  <td className="py-2.5 text-[#131722]">{stock.peRatio ? stock.peRatio.toFixed(1) : 'N/A'}</td>
                  <td className="py-2.5 text-[#131722]">{stock.eps ? formatCurrency(stock.eps, stock.currency) : 'N/A'}</td>
                  <td className="py-2.5 text-[#089981] font-bold">{stock.dividendYield !== undefined ? `${stock.dividendYield.toFixed(2)}%` : 'N/A'}</td>
                  <td className="py-2.5 text-[#131722] font-semibold">{stock.beta ? stock.beta.toFixed(2) : 'N/A'}</td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => navigate(`/stocks/${stock.symbol}`)}
                      className="bg-[#e8f0fe] hover:bg-[#2962ff] text-[#2962ff] hover:text-white px-2.5 py-1 rounded transition-colors text-[10px] font-bold"
                    >
                      Deep Analysis
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
