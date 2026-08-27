import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, Globe, DollarSign, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  changePercent: number;
  currency?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      api
        .get(`/stocks/search?q=${encodeURIComponent(query)}`)
        .then((res: any) => {
          const list = Array.isArray(res) ? res : res?.data || [];
          setResults(list);
          setLoading(false);
        })
        .catch(() => {
          setResults([]);
          setLoading(false);
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (symbol: string, exchange: string, providerSymbol?: string) => {
    onClose();
    const targetSymbol = providerSymbol || symbol;
    if (exchange === 'CRYPTO') {
      navigate('/crypto');
    } else if (exchange === 'FOREX') {
      navigate('/forex');
    } else if (exchange === 'COMMODITIES') {
      navigate('/futures');
    } else {
      navigate(`/stocks/${targetSymbol}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="bg-white border border-[#e0e3eb] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header Search Input */}
        <div className="p-3.5 border-b border-[#e0e3eb] flex items-center space-x-3 bg-[#f8f9fd]">
          <Search className="w-4 h-4 text-[#2962ff]" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-[#131722] font-mono text-sm placeholder-[#9598a1] outline-none font-medium"
            placeholder="Search symbol, company, index, crypto, forex (e.g. AAPL, TSLA, RELIANCE, BTCUSD)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[#707a8a] hover:text-[#131722]">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono bg-[#e0e3eb] text-[#131722] font-bold px-2 py-0.5 rounded">ESC</span>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-[#f0f3fa]">
          {loading ? (
            <div className="p-8 text-center text-xs font-mono text-[#707a8a] animate-pulse">
              Searching market data providers...
            </div>
          ) : results.length > 0 ? (
            results.map((res) => {
              const isPositive = res.changePercent >= 0;
              return (
                <div
                  key={res.symbol}
                  onClick={() => handleSelect(res.symbol, res.exchange, (res as any).providerSymbol)}
                  className="flex items-center justify-between p-2.5 rounded hover:bg-[#f0f3fa] cursor-pointer group transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded bg-[#e8f0fe] text-[#2962ff] flex items-center justify-center font-mono font-bold text-xs">
                      {res.exchange === 'CRYPTO' ? <Activity className="w-4 h-4" /> : res.exchange === 'FOREX' ? <DollarSign className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-mono font-bold text-[#131722] group-hover:text-[#2962ff] flex items-center space-x-2">
                        <span>{res.symbol}</span>
                        <span className="text-[10px] bg-[#f0f3fa] text-[#707a8a] font-normal px-1.5 py-0.2 rounded border border-[#e0e3eb]">
                          {res.exchange}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-[#707a8a] line-clamp-1">{res.name}</div>
                    </div>
                  </div>
                  {res.price > 0 && (
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-[#131722]">
                        {res.currency === 'INR' ? '₹' : '$'}
                        {res.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className={`text-[11px] font-semibold ${isPositive ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                        {isPositive ? '+' : ''}
                        {res.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : query.trim() ? (
            <div className="p-8 text-center text-xs font-mono text-[#707a8a]">
              No instruments found matching "{query}".
            </div>
          ) : (
            <div className="p-4">
              <div className="text-[10px] font-mono text-[#707a8a] uppercase tracking-wider mb-2.5 font-bold">Popular Market Symbols</div>
              <div className="flex flex-wrap gap-2">
                {['AAPL', 'TSLA', 'NVDA', 'RELIANCE:NSE', 'TCS:NSE', 'BTCUSD', 'ETHUSD', 'EURUSD', 'GOLD'].map((sym) => (
                  <button
                    key={sym}
                    onClick={() => handleSelect(sym, sym.includes(':NSE') ? 'NSE' : sym.includes('USD') ? 'CRYPTO' : 'US')}
                    className="bg-[#f8f9fd] border border-[#e0e3eb] hover:border-[#2962ff] text-[#131722] font-mono text-xs px-2.5 py-1.5 rounded flex items-center space-x-1.5 transition-all hover:bg-[#e8f0fe]"
                  >
                    <TrendingUp className="w-3 h-3 text-[#2962ff]" />
                    <span>{sym}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
