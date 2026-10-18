import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { usePortfolioStore } from '../../store/portfolioStore';
import { useAuthStore } from '../../store/authStore';
import { notify } from '../../store/notificationStore';
import { formatCurrency } from '../../utils/formatters';
import { AlertCircle, CheckCircle2, Minus, Plus, Zap } from 'lucide-react';
import { Segmented } from '../ui/Segmented';
import { LiveValue } from '../ui/LiveValue';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { FieldLabel } from '../ui/misc';
import { cn } from '../../utils/cn';

interface Props {
  symbol: string;
  currentPrice: number;
}

export const QuickTradePanel: React.FC<Props> = ({ symbol, currentPrice }) => {
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [executionType, setExecutionType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [quantity, setQuantity] = useState<number>(10);
  const [limitPrice, setLimitPrice] = useState<number>(currentPrice || 100);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const buyStock = usePortfolioStore((s) => s.buyStock);
  const sellStock = usePortfolioStore((s) => s.sellStock);
  const isOrdering = usePortfolioStore((s) => s.isOrdering);
  const error = usePortfolioStore((s) => s.error);
  const summary = usePortfolioStore((s) => s.summary);
  const fetchPortfolio = usePortfolioStore((s) => s.fetchPortfolio);
  const user = useAuthStore((state) => state.user);

  // Owned quantity for sells comes from the portfolio summary.
  useEffect(() => {
    if (!usePortfolioStore.getState().summary) fetchPortfolio();
  }, [fetchPortfolio]);

  const activePrice = executionType === 'LIMIT' ? limitPrice : currentPrice;
  const totalCost = (activePrice || 0) * (quantity || 0);
  const availableCash = user ? user.virtualCash : 0;
  const holding = summary?.holdings.find((h) => h.symbol === symbol.toUpperCase());
  const ownedQty = holding ? holding.quantity : 0;
  const isBuy = tradeType === 'BUY';
  const maxQty = isBuy ? Math.floor(availableCash / Math.max(activePrice || 1, 0.01)) : ownedQty;
  const insufficient = isBuy ? totalCost > availableCash : quantity > ownedQty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    if (!quantity || quantity <= 0) return;

    try {
      const res = isBuy ? await buyStock(symbol, quantity) : await sellStock(symbol, quantity);
      const msg = res?.message || `Successfully executed order for ${quantity} shares of ${symbol}`;
      setSuccessMsg(msg);
      notify({
        tone: isBuy ? 'up' : 'down',
        title: `${tradeType} ${quantity} ${symbol} filled`,
        message: `≈ ${formatCurrency(totalCost)} · ${executionType.toLowerCase()} order`,
      });
    } catch (err: any) {
      // Error is also surfaced inline by the store
      notify({ tone: 'error', title: `${tradeType} ${symbol} rejected`, message: err?.message });
    }
  };

  return (
    <section className="qf-panel overflow-hidden">
      <header className="qf-panel-header">
        <h3 className="flex items-center gap-2 font-mono text-2xs font-semibold uppercase tracking-[0.14em] text-fg">
          <Zap className="h-3.5 w-3.5 text-accent" />
          Order Ticket
        </h3>
        <span className="rounded border border-line bg-raised px-1.5 py-0.5 font-mono text-2xs font-bold text-fg">{symbol}</span>
      </header>

      <div className="space-y-3 p-3.5">
        <Segmented
          id={`side-${symbol}`}
          stretch
          tone={isBuy ? 'up' : 'down'}
          value={tradeType}
          onChange={(v) => {
            setTradeType(v);
            setSuccessMsg(null);
          }}
          options={[
            { value: 'BUY', label: 'Buy' },
            { value: 'SELL', label: 'Sell' },
          ]}
        />

        <Segmented
          id={`exec-${symbol}`}
          stretch
          size="xs"
          value={executionType}
          onChange={(v) => {
            setExecutionType(v);
            if (v === 'LIMIT') setLimitPrice(currentPrice);
          }}
          options={[
            { value: 'MARKET', label: 'Market' },
            { value: 'LIMIT', label: 'Limit' },
          ]}
        />

        <form onSubmit={handleSubmit} className="space-y-3 font-mono">
          {executionType === 'MARKET' ? (
            <div>
              <FieldLabel aside="Live">Market Price</FieldLabel>
              <div className="flex h-9 items-center rounded-md border border-line bg-bg/60 px-3 text-sm font-semibold text-fg">
                <LiveValue symbol={symbol} value={currentPrice} format={(v) => formatCurrency(v)} />
              </div>
            </div>
          ) : (
            <div>
              <FieldLabel htmlFor="limit-price">Limit Price ($)</FieldLabel>
              <input
                id="limit-price"
                type="number"
                step="0.01"
                value={limitPrice}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value) || currentPrice)}
                className="qf-input h-9 text-sm font-semibold"
              />
            </div>
          )}

          <div>
            <FieldLabel htmlFor="qty" aside={!isBuy ? `Owned ${ownedQty}` : undefined}>
              Quantity
            </FieldLabel>
            <div className="flex items-center gap-1.5">
              <div className="flex flex-1 items-center rounded-md border border-line bg-bg/60 focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/15">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-9 w-8 items-center justify-center text-fg-subtle transition-colors hover:text-fg active:scale-90"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  id="qty"
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 0))}
                  className="num h-9 w-full min-w-0 bg-transparent text-center text-sm font-semibold text-fg outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="flex h-9 w-8 items-center justify-center text-fg-subtle transition-colors hover:text-fg active:scale-90"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="mt-1.5 grid grid-cols-4 gap-1">
              {[10, 50, 100].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setQuantity(qty)}
                  className={cn(
                    'h-6 rounded border text-2xs font-semibold transition-[background-color,border-color,color,transform] duration-150 active:scale-95',
                    quantity === qty ? 'border-accent/40 bg-accent/10 text-accent' : 'border-line bg-raised/50 text-fg-muted hover:border-line-strong hover:text-fg',
                  )}
                >
                  {qty}
                </button>
              ))}
              <button
                type="button"
                onClick={() => maxQty > 0 && setQuantity(maxQty)}
                disabled={maxQty <= 0}
                className="h-6 rounded border border-line bg-raised/50 text-2xs font-semibold text-fg-muted transition-[background-color,border-color,color,transform] duration-150 hover:border-line-strong hover:text-fg active:scale-95 disabled:opacity-40"
                title={isBuy ? 'Max shares affordable with available cash' : 'Sell entire position'}
              >
                Max
              </button>
            </div>
          </div>

          {/* Estimate */}
          <div className="space-y-1.5 rounded-md border border-line bg-bg/40 p-2.5 text-xs">
            <div className="flex justify-between text-fg-subtle">
              <span>Est. value</span>
              <AnimatedNumber value={totalCost} format={(v) => formatCurrency(v)} duration={0.35} className="font-semibold text-fg" />
            </div>
            <div className="flex justify-between text-fg-subtle">
              <span>Cash</span>
              <AnimatedNumber value={availableCash} format={(v) => formatCurrency(v)} tintOnChange className="font-semibold text-up" />
            </div>
            <div className="relative mt-1 h-1 overflow-hidden rounded-full bg-line">
              <motion.div
                className={cn('absolute inset-y-0 left-0 rounded-full', insufficient ? 'bg-down' : isBuy ? 'bg-up' : 'bg-down/70')}
                animate={{ width: `${Math.min(100, isBuy ? (totalCost / Math.max(availableCash, 1)) * 100 : (quantity / Math.max(ownedQty, 1)) * 100)}%` }}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              />
            </div>
            {insufficient && (
              <p className="text-2xs text-down">{isBuy ? 'Exceeds available cash' : 'Exceeds owned quantity'}</p>
            )}
          </div>

          <AnimatePresence initial={false}>
            {error && (
              <motion.div
                key="err"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-2 rounded-md border border-down/30 bg-down/10 p-2 text-xs text-down">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
            {successMsg && (
              <motion.div
                key="ok"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 rounded-md border border-up/30 bg-up/10 p-2 text-xs font-semibold text-up">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isOrdering}
            className={cn(
              'group relative h-10 w-full overflow-hidden rounded-md font-mono text-xs font-bold tracking-wide transition-[filter,transform,box-shadow] duration-150 active:scale-[0.98]',
              isBuy
                ? 'bg-up text-[#04140c] shadow-[0_8px_24px_-10px_rgb(var(--qf-up)/0.8)] hover:brightness-110'
                : 'bg-down text-white shadow-[0_8px_24px_-10px_rgb(var(--qf-down)/0.8)] hover:brightness-110',
              isOrdering && 'cursor-not-allowed opacity-60',
            )}
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
            <span className="relative block truncate px-2">
              {isOrdering ? 'Executing…' : `${isBuy ? 'Buy' : 'Sell'} ${quantity} ${symbol} · ${executionType === 'MARKET' ? 'Mkt' : 'Lmt'}`}
            </span>
          </button>
        </form>
      </div>
    </section>
  );
};
