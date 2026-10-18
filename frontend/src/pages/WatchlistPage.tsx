import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useWatchlistStore } from '../store/watchlistStore';
import { notify } from '../store/notificationStore';
import { formatCurrency, formatSigned, formatSignedPercent } from '../utils/formatters';
import { Star, Plus, Trash2, ExternalLink, ShieldAlert, X } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { LiveValue } from '../components/ui/LiveValue';
import { EmptyState, SkeletonRows } from '../components/ui/misc';
import { cn } from '../utils/cn';

export const WatchlistPage: React.FC = () => {
  const navigate = useNavigate();
  const watchlists = useWatchlistStore((s) => s.watchlists);
  const activeWatchlistId = useWatchlistStore((s) => s.activeWatchlistId);
  const isLoading = useWatchlistStore((s) => s.isLoading);
  const fetchWatchlists = useWatchlistStore((s) => s.fetchWatchlists);
  const createWatchlist = useWatchlistStore((s) => s.createWatchlist);
  const addStock = useWatchlistStore((s) => s.addStock);
  const removeStock = useWatchlistStore((s) => s.removeStock);
  const setActiveWatchlist = useWatchlistStore((s) => s.setActiveWatchlist);

  const [newSymbol, setNewSymbol] = useState('');
  const [newWlName, setNewWlName] = useState('');
  const [showAddWl, setShowAddWl] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchWatchlists();
  }, [fetchWatchlists]);

  const activeWatchlist = watchlists.find((w) => w.id === activeWatchlistId) || watchlists[0];

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim() || !activeWatchlist) return;
    setErrorMsg(null);
    setAdding(true);
    const symbol = newSymbol.trim().toUpperCase();
    try {
      await addStock(activeWatchlist.id, newSymbol.trim());
      setNewSymbol('');
      notify({ tone: 'success', title: `${symbol} added to ${activeWatchlist.name}` });
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleCreateWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWlName.trim()) return;
    try {
      await createWatchlist(newWlName.trim());
      notify({ tone: 'success', title: `Watchlist "${newWlName.trim()}" created` });
      setNewWlName('');
      setShowAddWl(false);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleRemove = (symbol: string) => {
    if (!activeWatchlist) return;
    removeStock(activeWatchlist.id, symbol)
      .then(() => notify({ tone: 'info', title: `${symbol} removed`, message: activeWatchlist.name }))
      .catch((err: any) => setErrorMsg(err.message));
  };

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Star}
        eyebrow="Trading / Watchlists"
        title="Custom Market Watchlists"
        subtitle="Monitor real-time prices across your custom watchlists"
        actions={
          <Button variant="primary" onClick={() => setShowAddWl(!showAddWl)}>
            <Plus className={cn('h-3.5 w-3.5 transition-transform duration-200', showAddWl && 'rotate-45')} />
            New Watchlist
          </Button>
        }
      />

      <AnimatePresence initial={false}>
        {showAddWl && (
          <motion.form
            onSubmit={handleCreateWatchlist}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="qf-panel flex items-center gap-2 p-3">
              <input
                type="text"
                placeholder="Watchlist name (e.g. EV & Semiconductors)…"
                value={newWlName}
                onChange={(e) => setNewWlName(e.target.value)}
                className="qf-input"
                autoFocus
              />
              <Button type="submit" variant="buy" size="md">
                Create
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-line scrollbar-none">
        {watchlists.map((wl) => {
          const active = (activeWatchlist?.id ?? activeWatchlistId) === wl.id;
          return (
            <button
              key={wl.id}
              onClick={() => setActiveWatchlist(wl.id)}
              className={cn(
                'relative shrink-0 px-3 py-2 font-mono text-xs font-semibold transition-colors duration-150',
                active ? 'text-fg' : 'text-fg-subtle hover:text-fg-muted',
              )}
            >
              {wl.name}
              <span className="num ml-1.5 rounded bg-raised px-1 text-3xs text-fg-subtle">{wl.items.length}</span>
              {active && (
                <motion.span
                  layoutId="wl-tab"
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent shadow-[0_0_8px_rgb(var(--qf-accent)/0.8)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {isLoading && watchlists.length === 0 ? (
        <Panel>
          <SkeletonRows rows={6} />
        </Panel>
      ) : activeWatchlist ? (
        <Panel
          bodyClassName="p-0"
          title={activeWatchlist.name}
          icon={Star}
          actions={
            <form onSubmit={handleAddStock} className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Add ticker (e.g. NVDA)"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                className="qf-input h-7 w-36 py-0 uppercase sm:w-48"
              />
              <Button type="submit" variant="primary" size="sm" loading={adding}>
                Add
              </Button>
            </form>
          }
        >
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2 border-b border-down/20 bg-down/10 px-3.5 py-2 font-mono text-xs text-down">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    {errorMsg}
                  </span>
                  <button onClick={() => setErrorMsg(null)} aria-label="Dismiss error">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {activeWatchlist.items.length === 0 ? (
            <EmptyState icon={Star} title="No symbols in this watchlist yet." hint="Add a ticker above to start streaming it." className="m-3.5" />
          ) : (
            <div className="overflow-x-auto">
              <table className="qf-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Company Name</th>
                    <th className="text-right">Live Price</th>
                    <th className="text-right">Change</th>
                    <th className="text-right">Change %</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {activeWatchlist.items.map((item) => {
                      const currency =
                        item.symbol.includes(':NSE') || item.symbol.includes('RELIANCE') || item.symbol.includes('TCS') || item.symbol.includes('INFY')
                          ? 'INR'
                          : 'USD';
                      return (
                        <motion.tr
                          key={item.id}
                          layout="position"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          transition={{ duration: 0.2 }}
                          className="group"
                        >
                          <td className="font-semibold text-fg">{item.symbol}</td>
                          <td className="max-w-xs truncate font-sans text-fg-subtle">{item.name}</td>
                          <td className="text-right">
                            <LiveValue symbol={item.symbol} value={item.price} format={(v) => formatCurrency(v, currency)} className="font-semibold text-fg" />
                          </td>
                          <td className="text-right">
                            <LiveValue symbol={item.symbol} field="change" value={item.change} format={(v) => formatSigned(v)} signed />
                          </td>
                          <td className="text-right">
                            <LiveValue symbol={item.symbol} field="changePercent" value={item.changePercent} format={formatSignedPercent} pill className="text-[11px] font-semibold" />
                          </td>
                          <td className="text-right">
                            <div className="inline-flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                              <button
                                onClick={() => navigate(`/stocks/${item.symbol}`)}
                                className="rounded p-1.5 text-fg-muted transition-colors hover:bg-accent/10 hover:text-accent"
                                title="Open Analysis Chart"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleRemove(item.symbol)}
                                className="rounded p-1.5 text-fg-muted transition-colors hover:bg-down/10 hover:text-down"
                                title="Remove from Watchlist"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      ) : (
        <Panel>
          <EmptyState icon={Star} title="No watchlists found." hint="Create one to start tracking symbols." />
        </Panel>
      )}
    </div>
  );
};
