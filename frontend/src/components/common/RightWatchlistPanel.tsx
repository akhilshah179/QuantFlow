import React, { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Plus, Search, Star, X } from 'lucide-react';
import { useWatchlistStore } from '../../store/watchlistStore';
import { notify } from '../../store/notificationStore';
import { WatchlistItem } from '../../types/watchlist';
import { formatPrice, formatSignedPercent } from '../../utils/formatters';
import { LiveValue } from '../ui/LiveValue';
import { LiveDot } from '../ui/misc';
import { cn } from '../../utils/cn';

interface Props {
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
}

const Row: React.FC<{ item: WatchlistItem; onOpen: (s: string) => void; onRemove: (s: string) => void }> = memo(
  ({ item, onOpen, onRemove }) => (
    <motion.div
      layout="position"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      onClick={() => onOpen(item.symbol)}
      className="group grid cursor-pointer grid-cols-12 items-center border-b border-line/50 px-3 py-[7px] font-mono text-xs transition-colors hover:bg-raised/80"
    >
      <div className="col-span-5 min-w-0">
        <div className="truncate font-semibold text-fg transition-colors group-hover:text-accent">{item.symbol}</div>
        <div className="truncate font-sans text-3xs text-fg-subtle">{item.name}</div>
      </div>
      <div className="col-span-3 text-right">
        <LiveValue symbol={item.symbol} value={item.price || undefined} format={(v) => formatPrice(v)} className="text-fg" />
      </div>
      <div className="col-span-4 flex items-center justify-end gap-1">
        <LiveValue
          symbol={item.symbol}
          field="changePercent"
          value={item.changePercent}
          format={formatSignedPercent}
          pill
          className="text-[11px] font-semibold"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.symbol);
          }}
          className="w-0 overflow-hidden rounded text-fg-subtle opacity-0 transition-all duration-150 hover:text-down group-hover:w-4 group-hover:opacity-100"
          title="Remove from watchlist"
          aria-label={`Remove ${item.symbol}`}
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  ),
);
Row.displayName = 'WatchlistRow';

export const RightWatchlistPanel: React.FC<Props> = ({ isOpen, onClose, className }) => {
  const navigate = useNavigate();
  const watchlists = useWatchlistStore((s) => s.watchlists);
  const activeWatchlistId = useWatchlistStore((s) => s.activeWatchlistId);
  const removeStock = useWatchlistStore((s) => s.removeStock);
  const addStock = useWatchlistStore((s) => s.addStock);
  const setActiveWatchlist = useWatchlistStore((s) => s.setActiveWatchlist);

  const [newSymbol, setNewSymbol] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const activeWatchlist = watchlists.find((w) => w.id === activeWatchlistId) || watchlists[0];

  const handleAddSymbol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim() || !activeWatchlist) return;
    const symbol = newSymbol.trim().toUpperCase();
    setNewSymbol('');
    setIsAdding(false);
    try {
      await addStock(activeWatchlist.id, symbol);
      notify({ tone: 'success', title: `${symbol} added`, message: `Streaming in ${activeWatchlist.name}` });
    } catch (err: any) {
      notify({ tone: 'error', title: `Couldn't add ${symbol}`, message: err.message });
    }
  };

  const handleRemove = (symbol: string) => {
    if (!activeWatchlist) return;
    removeStock(activeWatchlist.id, symbol).catch((err: any) =>
      notify({ tone: 'error', title: `Couldn't remove ${symbol}`, message: err.message }),
    );
  };

  const filteredItems =
    activeWatchlist?.items.filter((item) => item.symbol.toLowerCase().includes(searchFilter.toLowerCase())) || [];

  return (
    <aside className={cn('flex h-full w-72 select-none flex-col border-l border-line bg-surface/90', className)}>
      {/* Header */}
      <div className="flex h-10 items-center justify-between border-b border-line px-3">
        <div className="flex items-center gap-2">
          <Star className="h-3.5 w-3.5 text-accent" />
          <span className="font-mono text-2xs font-semibold uppercase tracking-[0.14em] text-fg">Watchlist</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className={cn(
              'rounded p-1 transition-[color,background-color,transform] duration-150',
              isAdding ? 'rotate-45 bg-accent/10 text-accent' : 'text-fg-subtle hover:bg-raised hover:text-accent',
            )}
            title="Add symbol to watchlist"
            aria-label="Add symbol"
          >
            <Plus className="h-4 w-4" />
          </button>
          {onClose && (
            <button onClick={onClose} className="rounded p-1 text-fg-subtle hover:bg-raised hover:text-fg xl:hidden" aria-label="Close watchlist">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Selector + filter */}
      <div className="space-y-2 border-b border-line px-3 py-2">
        <div className="relative">
          <select
            value={activeWatchlist?.id}
            onChange={(e) => setActiveWatchlist(e.target.value)}
            className="w-full cursor-pointer appearance-none rounded-md border border-line bg-bg/60 py-1.5 pl-2.5 pr-7 font-mono text-xs font-semibold text-fg focus:border-accent/60 focus:outline-none"
          >
            {watchlists.map((wl) => (
              <option key={wl.id} value={wl.id}>
                {wl.name} ({wl.items.length})
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-fg-subtle" />
          <input
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter symbols"
            className="qf-input h-7 py-0 pl-7 text-2xs"
          />
        </div>
      </div>

      {/* Add form */}
      <AnimatePresence initial={false}>
        {isAdding && (
          <motion.form
            onSubmit={handleAddSymbol}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden border-b border-line bg-raised/40"
          >
            <div className="flex items-center gap-2 p-2">
              <input
                type="text"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                placeholder="Ticker, e.g. AAPL"
                className="qf-input h-7 py-0 text-2xs uppercase"
                autoFocus
              />
              <button type="submit" className="h-7 rounded-md bg-accent px-2.5 font-mono text-2xs font-bold text-accent-fg transition-[filter,transform] hover:brightness-110 active:scale-95">
                Add
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Column header */}
      <div className="grid grid-cols-12 border-b border-line px-3 py-1.5 font-mono text-3xs font-semibold uppercase tracking-wider text-fg-subtle">
        <div className="col-span-5">Symbol</div>
        <div className="col-span-3 text-right">Last</div>
        <div className="col-span-4 text-right">Chg%</div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence initial={false}>
          {filteredItems.map((item) => (
            <Row key={item.id || item.symbol} item={item} onOpen={(s) => navigate(`/stocks/${s}`)} onRemove={handleRemove} />
          ))}
        </AnimatePresence>
        {filteredItems.length === 0 && (
          <div className="p-6 text-center font-mono text-xs text-fg-subtle">
            {watchlists.length === 0 ? 'No watchlists yet.' : 'No symbols in watchlist.'}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-line px-3 py-1.5 font-mono text-3xs uppercase tracking-wider text-fg-subtle">
        <span>QuantFlow market feeds</span>
        <span className="flex items-center gap-1.5 text-up">
          <LiveDot tone="up" />
          Live
        </span>
      </div>
    </aside>
  );
};
