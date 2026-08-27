import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWatchlistStore } from '../store/watchlistStore';
import { useMarketStore } from '../store/marketStore';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { Bookmark, Plus, Trash2, ExternalLink, TrendingUp, TrendingDown, ShieldAlert } from 'lucide-react';

export const WatchlistPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    watchlists,
    activeWatchlistId,
    fetchWatchlists,
    createWatchlist,
    addStock,
    removeStock,
    setActiveWatchlist,
  } = useWatchlistStore();

  const quotes = useMarketStore((state) => state.quotes);

  const [newSymbol, setNewSymbol] = useState('');
  const [newWlName, setNewWlName] = useState('');
  const [showAddWl, setShowAddWl] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchWatchlists();
  }, [fetchWatchlists]);

  const activeWatchlist = watchlists.find((w) => w.id === activeWatchlistId) || watchlists[0];

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim() || !activeWatchlist) return;
    setErrorMsg(null);
    try {
      await addStock(activeWatchlist.id, newSymbol.trim());
      setNewSymbol('');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWlName.trim()) return;
    try {
      await createWatchlist(newWlName.trim());
      setNewWlName('');
      setShowAddWl(false);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="space-y-4 text-[#131722]">
      {/* Title Header & Actions */}
      <div className="bg-white border border-[#e0e3eb] rounded-lg p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold font-mono text-[#131722] flex items-center space-x-2">
            <Bookmark className="w-5 h-5 text-[#2962ff]" />
            <span>Custom Market Watchlists</span>
          </h1>
          <p className="text-xs text-[#707a8a] mt-0.5 font-medium">Monitor real-time prices across your custom portfolio watchlists</p>
        </div>

        <button
          onClick={() => setShowAddWl(!showAddWl)}
          className="flex items-center space-x-1.5 bg-[#2962ff] hover:bg-[#1e54e4] text-white font-mono text-xs font-bold px-3 py-1.5 rounded transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Watchlist</span>
        </button>
      </div>

      {/* New Watchlist Inline Input Form */}
      {showAddWl && (
        <form onSubmit={handleCreateWatchlist} className="bg-white border border-[#e0e3eb] p-3.5 rounded-lg flex items-center space-x-3 shadow-xs">
          <input
            type="text"
            placeholder="Watchlist Name (e.g. EV & Semiconductors)..."
            value={newWlName}
            onChange={(e) => setNewWlName(e.target.value)}
            className="flex-1 bg-[#f8f9fd] border border-[#e0e3eb] rounded px-3 py-1.5 text-xs text-[#131722] font-mono focus:outline-none focus:border-[#2962ff]"
          />
          <button type="submit" className="bg-[#089981] text-white px-4 py-1.5 text-xs font-mono font-bold rounded hover:bg-[#066d5c]">
            Create
          </button>
        </form>
      )}

      {/* Watchlist Selection Tab Strip */}
      <div className="flex items-center space-x-2 border-b border-[#e0e3eb] pb-2 overflow-x-auto">
        {watchlists.map((wl) => (
          <button
            key={wl.id}
            onClick={() => setActiveWatchlist(wl.id)}
            className={`px-3 py-1.5 rounded font-mono text-xs font-bold transition-colors ${
              activeWatchlistId === wl.id
                ? 'bg-[#2962ff] text-white shadow-xs'
                : 'text-[#707a8a] hover:text-[#131722] hover:bg-[#f0f3fa] bg-white border border-[#e0e3eb]'
            }`}
          >
            {wl.name} ({wl.items.length})
          </button>
        ))}
      </div>

      {activeWatchlist ? (
        <div className="bg-white border border-[#e0e3eb] rounded-lg p-3.5 space-y-3.5 shadow-xs">
          {/* Add Symbol Input */}
          <form onSubmit={handleAddStock} className="flex items-center space-x-3">
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                placeholder="Add ticker symbol (e.g. NVDA)..."
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded px-3 py-1.5 text-xs font-mono text-[#131722] placeholder-[#9598a1] focus:outline-none focus:border-[#2962ff]"
              />
            </div>
            <button
              type="submit"
              className="bg-[#2962ff] hover:bg-[#1e54e4] text-white font-mono text-xs font-bold px-3.5 py-1.5 rounded transition-colors"
            >
              Add Symbol
            </button>
          </form>

          {errorMsg && (
            <div className="text-xs text-[#f23645] font-mono flex items-center space-x-1 font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-[#707a8a] border-b border-[#e0e3eb] uppercase text-[10px]">
                  <th className="pb-2">Symbol</th>
                  <th className="pb-2">Company Name</th>
                  <th className="pb-2">Live Price</th>
                  <th className="pb-2">Change</th>
                  <th className="pb-2">Change %</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f3fa]">
                {activeWatchlist.items.map((item) => {
                  const liveTick = quotes[item.symbol];
                  const price = liveTick ? liveTick.price : item.price;
                  const change = liveTick ? liveTick.change : item.change;
                  const changePercent = liveTick ? liveTick.changePercent : item.changePercent;
                  const isUp = change >= 0;
                  const currency = item.symbol.includes(':NSE') || item.symbol.includes('RELIANCE') || item.symbol.includes('TCS') || item.symbol.includes('INFY') ? 'INR' : 'USD';

                  return (
                    <tr key={item.id} className="hover:bg-[#f8f9fd] transition-colors">
                      <td className="py-2.5 font-bold text-[#131722] text-xs">{item.symbol}</td>
                      <td className="py-2.5 text-[#707a8a] max-w-xs truncate font-medium">{item.name}</td>
                      <td className="py-2.5 text-[#131722] font-bold text-xs">{formatCurrency(price, currency)}</td>
                      <td className={`py-2.5 font-bold ${isUp ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                        {isUp ? '+' : ''}{change.toFixed(2)}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded font-bold text-[11px] ${
                            isUp ? 'bg-[#e6f4f1] text-[#089981]' : 'bg-[#fdecee] text-[#f23645]'
                          }`}
                        >
                          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span>{formatPercent(changePercent)}</span>
                        </span>
                      </td>
                      <td className="py-2.5 text-right space-x-1.5">
                        <button
                          onClick={() => navigate(`/stocks/${item.symbol}`)}
                          className="p-1 hover:bg-[#e8f0fe] text-[#2962ff] rounded transition-colors"
                          title="Open Analysis Chart"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeStock(activeWatchlist.id, item.symbol)}
                          className="p-1 hover:bg-[#fdecee] text-[#f23645] rounded transition-colors"
                          title="Remove from Watchlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-[#707a8a] font-mono bg-white border border-[#e0e3eb] rounded-lg">No watchlists found.</div>
      )}
    </div>
  );
};
