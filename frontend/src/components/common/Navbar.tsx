import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, TrendingUp, User, LogOut, Wallet } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { useMarketStore } from '../../store/marketStore';
import { useAuthStore } from '../../store/authStore';
import { ConnectionStatusBadge } from './ConnectionStatusBadge';
import { formatCurrency } from '../../utils/formatters';
import api from '../../services/api';
import { SearchResult } from '../../types/stock';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const connectionStatus = useMarketStore((state) => state.connectionStatus);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 250);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    api.get(`/stocks/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res: any) => {
        setResults(res.data || []);
        setIsOpen(true);
      })
      .catch(() => setResults([]))
      .finally(() => setIsSearching(false));
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStock = (symbol: string) => {
    setQuery('');
    setIsOpen(false);
    navigate(`/stocks/${symbol}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#e0e3eb] px-4 py-2 flex items-center justify-between shadow-xs">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-6">
        <Link to="/" className="flex items-center space-x-2 text-[#131722] font-bold text-lg tracking-tight group">
          <div className="bg-[#2962ff] p-1.5 rounded text-white group-hover:bg-[#1e54e4] transition-colors">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="font-mono">QuantFlow</span>
        </Link>
      </div>

      {/* Fast Stock Search Bar */}
      <div className="relative flex-1 max-w-md mx-6" ref={dropdownRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#707a8a]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim() && setIsOpen(true)}
            placeholder="Search stock symbol, company name (e.g. AAPL, TSLA)..."
            className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded-lg pl-9 pr-4 py-1.5 text-xs text-[#131722] placeholder-[#9598a1] focus:outline-none focus:border-[#2962ff] transition-colors"
          />
        </div>

        {/* Dropdown Results */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e0e3eb] rounded-lg shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto">
            {isSearching ? (
              <div className="p-3 text-xs text-[#707a8a] text-center font-mono">Searching market catalog...</div>
            ) : results.length > 0 ? (
              results.map((item) => (
                <button
                  key={item.symbol}
                  onClick={() => handleSelectStock(item.symbol)}
                  className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-[#f0f3fa] text-left transition-colors border-b border-[#f0f3fa] last:border-0"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-[#131722] text-xs">{item.symbol}</span>
                      <span className="text-[10px] bg-[#f0f3fa] text-[#707a8a] px-1.5 py-0.5 rounded font-mono">{item.exchange}</span>
                    </div>
                    <div className="text-[11px] text-[#707a8a] truncate max-w-xs">{item.name}</div>
                  </div>
                  <div className="font-mono text-xs text-[#131722] font-semibold">
                    {formatCurrency(item.price, item.currency)}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-3 text-xs text-[#707a8a] text-center">No stocks matching "{query}"</div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls: WS Status & User Profile */}
      <div className="flex items-center space-x-3">
        <ConnectionStatusBadge status={connectionStatus} />

        {isAuthenticated && user ? (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 bg-[#f8f9fd] border border-[#e0e3eb] px-2.5 py-1 rounded text-xs font-mono text-[#131722]">
              <Wallet className="w-3.5 h-3.5 text-[#089981]" />
              <span className="text-[#707a8a]">Cash:</span>
              <span className="text-[#089981] font-bold">{formatCurrency(user.virtualCash)}</span>
            </div>

            <div className="flex items-center space-x-2 border-l border-[#e0e3eb] pl-3">
              <div className="flex items-center space-x-1.5 text-xs text-[#131722]">
                <User className="w-3.5 h-3.5 text-[#2962ff]" />
                <span className="font-semibold hidden sm:inline font-mono">{user.name}</span>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-1 hover:bg-[#f0f3fa] text-[#707a8a] hover:text-[#f23645] rounded transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Link
              to="/login"
              className="text-xs text-[#131722] hover:text-[#2962ff] px-3 py-1.5 rounded hover:bg-[#f0f3fa] transition-colors font-mono"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-xs bg-[#2962ff] hover:bg-[#1e54e4] text-white font-mono font-semibold px-3 py-1.5 rounded transition-colors shadow-xs"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
