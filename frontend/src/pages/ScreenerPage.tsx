import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { StockQuote } from '../types/stock';
import { formatCurrency, formatPercent, formatNumber } from '../utils/formatters';
import { MarketStatusBadge } from '../components/common/MarketStatusBadge';
import { Filter, Search, RotateCcw } from 'lucide-react';

export const ScreenerPage: React.FC = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);

  // Screener Filters
  const [exchange, setExchange] = useState<string>('ALL');
  const [sector, setSector] = useState<string>('ALL');
  const [maxPeRatio, setMaxPeRatio] = useState<string>('');
  const [minDividendYield, setMinDividendYield] = useState<string>('');
  const [query, setQuery] = useState<string>('');

  const fetchScreenerData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (exchange !== 'ALL') params.append('exchange', exchange);
    if (sector !== 'ALL') params.append('sector', sector);
    if (maxPeRatio) params.append('maxPeRatio', maxPeRatio);
    if (minDividendYield) params.append('minDividendYield', minDividendYield);
    if (query) params.append('query', query);

    api.get(`/stocks/screener?${params.toString()}`)
      .then((res: any) => {
        setStocks(Array.isArray(res) ? res : (res?.data || []));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchScreenerData();
  }, [exchange, sector, maxPeRatio, minDividendYield]);

  const handleReset = () => {
    setExchange('ALL');
    setSector('ALL');
    setMaxPeRatio('');
    setMinDividendYield('');
    setQuery('');
  };

  return (
    <div className="space-y-4 text-[#131722]">
      {/* Title Header */}
      <div className="bg-white border border-[#e0e3eb] rounded-lg p-4 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold font-mono text-[#131722] flex items-center space-x-2">
            <Filter className="w-5 h-5 text-[#2962ff]" />
            <span>Financial Stock Screener Workstation</span>
          </h1>
          <p className="text-xs text-[#707a8a] mt-0.5 font-medium">Filter equities across global exchanges by valuation multiples, sector, and yield</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-mono">
          {/* Exchange Filter */}
          <div>
            <label className="block text-[#707a8a] text-[10px] uppercase font-bold mb-1">Exchange</label>
            <select
              value={exchange}
              onChange={(e) => setExchange(e.target.value)}
              className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded px-2.5 py-1.5 text-[#131722] font-semibold focus:outline-none focus:border-[#2962ff]"
            >
              <option value="ALL">All Exchanges</option>
              <option value="NASDAQ">NASDAQ</option>
              <option value="NYSE">NYSE</option>
              <option value="NSE">NSE (India)</option>
              <option value="LSE">LSE (London)</option>
              <option value="DAX">DAX (Germany)</option>
              <option value="Nikkei">Nikkei (Japan)</option>
              <option value="HKEX">HKEX (Hong Kong)</option>
            </select>
          </div>

          {/* Sector Filter */}
          <div>
            <label className="block text-[#707a8a] text-[10px] uppercase font-bold mb-1">Sector</label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded px-2.5 py-1.5 text-[#131722] font-semibold focus:outline-none focus:border-[#2962ff]"
            >
              <option value="ALL">All Sectors</option>
              <option value="Technology">Technology</option>
              <option value="Energy">Energy</option>
              <option value="Consumer Cyclical">Consumer Cyclical</option>
              <option value="Communication Services">Communication Services</option>
              <option value="Financial Services">Financial Services</option>
            </select>
          </div>

          {/* Max P/E */}
          <div>
            <label className="block text-[#707a8a] text-[10px] uppercase font-bold mb-1">Max P/E Ratio</label>
            <input
              type="number"
              placeholder="e.g. 35"
              value={maxPeRatio}
              onChange={(e) => setMaxPeRatio(e.target.value)}
              className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded px-2.5 py-1.5 text-[#131722] placeholder-[#9598a1] focus:outline-none focus:border-[#2962ff]"
            />
          </div>

          {/* Min Dividend Yield */}
          <div>
            <label className="block text-[#707a8a] text-[10px] uppercase font-bold mb-1">Min Div Yield (%)</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 0.5"
              value={minDividendYield}
              onChange={(e) => setMinDividendYield(e.target.value)}
              className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded px-2.5 py-1.5 text-[#131722] placeholder-[#9598a1] focus:outline-none focus:border-[#2962ff]"
            />
          </div>

          {/* Search Query Filter */}
          <div>
            <label className="block text-[#707a8a] text-[10px] uppercase font-bold mb-1">Search Symbol / Name</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Symbol / Name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchScreenerData()}
                className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded pl-8 pr-2.5 py-1.5 text-[#131722] placeholder-[#9598a1] focus:outline-none focus:border-[#2962ff]"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#707a8a]" />
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-[#f0f3fa] pt-2">
          <button
            onClick={handleReset}
            className="flex items-center space-x-1 bg-[#f8f9fd] hover:bg-[#e8f0fe] border border-[#e0e3eb] text-[#707a8a] hover:text-[#2962ff] px-3 py-1 rounded text-xs font-mono font-bold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-[#f0f3fa] pb-2">
          <h2 className="text-xs font-bold font-mono text-[#131722] uppercase tracking-wider">
            Matching Stock Results ({stocks.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-[#707a8a] font-mono animate-pulse">Running Screener Query...</div>
        ) : stocks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-[#707a8a] border-b border-[#e0e3eb] uppercase text-[10px]">
                  <th className="pb-2">Symbol</th>
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Exchange</th>
                  <th className="pb-2">Sector</th>
                  <th className="pb-2">Price</th>
                  <th className="pb-2">Change %</th>
                  <th className="pb-2">Market Cap</th>
                  <th className="pb-2">P/E</th>
                  <th className="pb-2">EPS</th>
                  <th className="pb-2">Div Yield</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f3fa]">
                {stocks.map((stock) => {
                  const isUp = stock.change >= 0;
                  return (
                    <tr key={stock.symbol} className="hover:bg-[#f8f9fd] transition-colors">
                      <td className="py-2.5 font-bold text-[#131722]">{stock.symbol}</td>
                      <td className="py-2.5 text-[#707a8a] max-w-xs truncate font-medium">{stock.name}</td>
                      <td className="py-2.5 text-[#131722]">{stock.exchange}</td>
                      <td className="py-2.5 text-[#131722]">{stock.sector || 'N/A'}</td>
                      <td className="py-2.5 font-bold text-[#131722]">{formatCurrency(stock.price, stock.currency)}</td>
                      <td className="py-2.5">
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${isUp ? 'bg-[#e6f4f1] text-[#089981]' : 'bg-[#fdecee] text-[#f23645]'}`}>
                          {isUp ? '+' : ''}{formatPercent(stock.changePercent)}
                        </span>
                      </td>
                      <td className="py-2.5 text-[#131722]">{stock.marketCap ? formatNumber(stock.marketCap) : 'N/A'}</td>
                      <td className="py-2.5 text-[#131722]">{stock.peRatio ? stock.peRatio.toFixed(1) : 'N/A'}</td>
                      <td className="py-2.5 text-[#131722]">{stock.eps ? formatCurrency(stock.eps, stock.currency) : 'N/A'}</td>
                      <td className="py-2.5 text-[#089981] font-bold">{stock.dividendYield !== undefined ? `${stock.dividendYield.toFixed(2)}%` : 'N/A'}</td>
                      <td className="py-2.5">
                        <MarketStatusBadge status={stock.marketStatus} />
                      </td>
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
        ) : (
          <div className="p-8 text-center text-[#707a8a] font-mono">No stocks matching selected screener criteria.</div>
        )}
      </div>
    </div>
  );
};
