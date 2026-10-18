import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, X, TrendingUp, Globe, DollarSign, Activity, CornerDownLeft, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { cn } from '../../utils/cn';
import { formatSignedPercent } from '../../utils/formatters';

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

const POPULAR = ['AAPL', 'TSLA', 'NVDA', 'RELIANCE:NSE', 'TCS:NSE', 'BTCUSD', 'ETHUSD', 'EURUSD', 'GOLD'];

function exchangeIcon(exchange: string) {
  if (exchange === 'CRYPTO') return Activity;
  if (exchange === 'FOREX') return DollarSign;
  if (exchange === 'COMMODITIES') return Layers;
  return Globe;
}

export const GlobalSearchModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setCursor(0);
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
          setCursor(0);
          setLoading(false);
        })
        .catch(() => {
          setResults([]);
          setLoading(false);
        });
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (symbol: string, exchange: string) => {
    onClose();
    if (exchange === 'CRYPTO') {
      navigate(`/crypto?symbol=${encodeURIComponent(symbol)}`);
    } else if (exchange === 'FOREX') {
      navigate(`/forex?symbol=${encodeURIComponent(symbol)}`);
    } else if (exchange === 'COMMODITIES') {
      navigate(`/futures?symbol=${encodeURIComponent(symbol)}`);
    } else {
      navigate(`/stocks/${symbol}`);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown' && results.length) {
      e.preventDefault();
      setCursor((c) => (c + 1) % results.length);
    } else if (e.key === 'ArrowUp' && results.length) {
      e.preventDefault();
      setCursor((c) => (c - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[cursor]) {
      e.preventDefault();
      handleSelect(results[cursor].symbol, results[cursor].exchange);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 p-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
          onKeyDown={onKeyDown}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search instruments"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 480, damping: 36 }}
            className="w-full max-w-2xl overflow-hidden rounded-xl border border-line-strong bg-overlay shadow-pop"
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <Search className="h-4 w-4 text-accent" />
              <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-transparent font-mono text-sm text-fg outline-none placeholder:text-fg-subtle"
                placeholder="Search symbol, company, index, crypto, forex (e.g. AAPL, RELIANCE, BTCUSD)…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-fg-subtle hover:text-fg" aria-label="Clear search">
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd className="qf-kbd">ESC</kbd>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-1.5">
              {loading ? (
                <div className="space-y-1 p-1.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-11 animate-pulse rounded-md bg-raised/60" />
                  ))}
                </div>
              ) : results.length > 0 ? (
                results.map((res, i) => {
                  const Icon = exchangeIcon(res.exchange);
                  const active = i === cursor;
                  return (
                    <div
                      key={`${res.symbol}-${res.exchange}`}
                      onClick={() => handleSelect(res.symbol, res.exchange)}
                      onMouseEnter={() => setCursor(i)}
                      className={cn(
                        'relative flex cursor-pointer items-center justify-between rounded-md px-3 py-2 transition-colors duration-100',
                        active ? 'bg-raised' : 'hover:bg-raised/60',
                      )}
                    >
                      {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-accent" />}
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-bg/60 text-fg-muted">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 font-mono text-xs font-semibold text-fg">
                            <span className={cn(active && 'text-accent')}>{res.symbol}</span>
                            <span className="rounded border border-line px-1.5 text-3xs font-normal text-fg-subtle">{res.exchange}</span>
                          </div>
                          <div className="truncate text-[11px] text-fg-subtle">{res.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {res.price > 0 && (
                          <div className="text-right font-mono">
                            <div className="num text-xs font-semibold text-fg">
                              {res.currency === 'INR' ? '₹' : '$'}
                              {res.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <div className={cn('num text-[11px] font-semibold', res.changePercent >= 0 ? 'text-up' : 'text-down')}>
                              {formatSignedPercent(res.changePercent)}
                            </div>
                          </div>
                        )}
                        <CornerDownLeft className={cn('h-3.5 w-3.5 text-fg-subtle transition-opacity', active ? 'opacity-100' : 'opacity-0')} />
                      </div>
                    </div>
                  );
                })
              ) : query.trim() ? (
                <div className="p-8 text-center font-mono text-xs text-fg-subtle">No instruments found matching "{query}".</div>
              ) : (
                <div className="p-3">
                  <div className="qf-label mb-2.5">Popular symbols</div>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR.map((sym) => (
                      <button
                        key={sym}
                        onClick={() => handleSelect(sym, sym.includes(':NSE') ? 'NSE' : sym.includes('USD') ? 'CRYPTO' : 'US')}
                        className="flex items-center gap-1.5 rounded-md border border-line bg-bg/60 px-2.5 py-1.5 font-mono text-xs text-fg-muted transition-[border-color,color,transform] duration-150 hover:-translate-y-px hover:border-accent/50 hover:text-fg"
                      >
                        <TrendingUp className="h-3 w-3 text-accent" />
                        <span>{sym}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 border-t border-line px-4 py-2 font-mono text-3xs uppercase tracking-wider text-fg-subtle">
              <span className="flex items-center gap-1.5">
                <kbd className="qf-kbd">↑↓</kbd> Navigate
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="qf-kbd">↵</kbd> Open
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="qf-kbd">esc</kbd> Close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
