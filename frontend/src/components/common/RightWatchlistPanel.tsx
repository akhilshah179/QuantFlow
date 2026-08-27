import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWatchlistStore } from '../../store/watchlistStore';
import { useMarketStore } from '../../store/marketStore';
import { formatPercent } from '../../utils/formatters';
import { Plus, X, Bookmark, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose?: () => void;
}

export const RightWatchlistPanel: React.FC<Props> = ({ isOpen }) => {
  const navigate = useNavigate();
  const { watchlists, activeWatchlistId, removeStock, addStock, setActiveWatchlist } = useWatchlistStore();
  const quotes = useMarketStore((state) => state.quotes);
  
  const [newSymbol, setNewSymbol] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const activeWatchlist = watchlists.find((w) => w.id === activeWatchlistId) || watchlists[0];

  const handleAddSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim() || !activeWatchlist) return;
    addStock(activeWatchlist.id, newSymbol.trim().toUpperCase());
    setNewSymbol('');
    setIsAdding(false);
  };

  const filteredItems = activeWatchlist?.items.filter((item) =>
    item.symbol.toLowerCase().includes(searchFilter.toLowerCase())
  ) || [];

  return (
    <aside className="w-72 bg-white border-l border-[#e0e3eb] flex flex-col h-full z-20 select-none text-[#131722]">
      {/* Watchlist Header */}
      <div className="p-3 border-b border-[#e0e3eb] flex items-center justify-between bg-white">
        <div className="flex items-center space-x-2">
          <Bookmark className="w-4 h-4 text-[#2962ff]" />
          <span className="font-bold text-xs uppercase tracking-wider text-[#131722] font-mono">Watchlist</span>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-1 rounded text-[#707a8a] hover:text-[#2962ff] hover:bg-[#f0f3fa] transition-colors"
          title="Add symbol to watchlist"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Watchlist Selector Dropdown */}
      <div className="px-3 py-2 border-b border-[#e0e3eb] bg-[#f8f9fd] flex items-center justify-between">
        <select
          value={activeWatchlist?.id}
          onChange={(e) => setActiveWatchlist(e.target.value)}
          className="bg-transparent text-xs font-bold text-[#131722] font-mono focus:outline-none cursor-pointer flex-1"
        >
          {watchlists.map((wl) => (
            <option key={wl.id} value={wl.id}>
              {wl.name} ({wl.items.length})
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-[#707a8a] pointer-events-none" />
      </div>

      {/* Add Symbol Input Form */}
      {isAdding && (
        <form onSubmit={handleAddSymbol} className="p-2 border-b border-[#e0e3eb] bg-[#f0f3fa] flex items-center space-x-2">
          <input
            type="text"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            placeholder="Add ticker (e.g. AAPL)..."
            className="flex-1 bg-white border border-[#e0e3eb] rounded px-2.5 py-1 text-xs text-[#131722] font-mono focus:outline-none focus:border-[#2962ff]"
            autoFocus
          />
          <button type="submit" className="bg-[#2962ff] text-white px-2 py-1 rounded text-xs font-bold font-mono hover:bg-[#1e54e4]">
            Add
          </button>
        </form>
      )}

      {/* Table Column Header */}
      <div className="px-3 py-1.5 border-b border-[#e0e3eb] bg-[#f8f9fd] grid grid-cols-12 text-[10px] font-mono text-[#707a8a] uppercase font-semibold">
        <div className="col-span-5">Symbol</div>
        <div className="col-span-3 text-right">Last</div>
        <div className="col-span-4 text-right">Chg%</div>
      </div>

      {/* Symbol Rows List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#f0f3fa]">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => {
            const quote = quotes[item.symbol];
            const price = quote?.price || item.price || 150.00;
            const changePercent = quote?.changePercent || item.changePercent || 0;
            const isUp = changePercent >= 0;

            return (
              <div
                key={item.id || item.symbol}
                onClick={() => navigate(`/stocks/${item.symbol}`)}
                className="px-3 py-2 grid grid-cols-12 items-center hover:bg-[#f0f3fa] cursor-pointer transition-colors group text-xs font-mono"
              >
                <div className="col-span-5 flex items-center space-x-1 overflow-hidden">
                  <span className="font-bold text-[#131722] truncate">{item.symbol}</span>
                </div>

                <div className="col-span-3 text-right font-medium text-[#131722]">
                  {price.toFixed(2)}
                </div>

                <div className="col-span-4 flex items-center justify-end space-x-1">
                  <span
                    className={`font-semibold px-1.5 py-0.5 rounded text-[11px] flex items-center space-x-0.5 ${
                      isUp ? 'bg-[#e6f4f1] text-[#089981]' : 'bg-[#fdecee] text-[#f23645]'
                    }`}
                  >
                    {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    <span>{formatPercent(changePercent)}</span>
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStock(activeWatchlist.id, item.symbol);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-[#707a8a] hover:text-[#f23645] transition-opacity"
                    title="Remove from watchlist"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-4 text-center text-xs text-[#707a8a] font-mono">
            No symbols in watchlist.
          </div>
        )}
      </div>

      {/* Mini Watchlist Footer */}
      <div className="p-2 border-t border-[#e0e3eb] bg-[#f8f9fd] text-[10px] font-mono text-[#707a8a] flex items-center justify-between">
        <span>QUANTFLOW MARKET FEEDS</span>
        <span className="text-[#089981] font-bold">LIVE</span>
      </div>
    </aside>
  );
};
