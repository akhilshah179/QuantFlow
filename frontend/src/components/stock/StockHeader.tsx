import React from 'react';
import { StockQuote } from '../../types/stock';
import { WSTickUpdate } from '../../types/ws';
import { formatCurrency, formatNumber, formatSigned, formatSignedPercent } from '../../utils/formatters';
import { MarketStatusBadge } from '../common/MarketStatusBadge';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { LiveValue } from '../ui/LiveValue';
import { cn } from '../../utils/cn';

interface Props {
  quote: StockQuote;
  realtimeTick?: WSTickUpdate | null;
}

export const StockHeader: React.FC<Props> = ({ quote, realtimeTick }) => {
  const currentPrice = realtimeTick ? realtimeTick.price : quote.price;
  const previousClose = quote.previousClose > 0 ? quote.previousClose : quote.price;
  const dailyChange = Number((currentPrice - previousClose).toFixed(2));
  const dailyChangePercent = previousClose > 0 ? Number(((dailyChange / previousClose) * 100).toFixed(2)) : 0;
  const isPositiveDaily = dailyChange >= 0;
  const currency = quote.currency || 'USD';

  // Day range position of the live price (0..1).
  const lo = Math.min(quote.dayLow || currentPrice, currentPrice);
  const hi = Math.max(quote.dayHigh || currentPrice, currentPrice);
  const rangePos = hi > lo ? (currentPrice - lo) / (hi - lo) : 0.5;

  const stats: Array<{ label: string; value: React.ReactNode; tone?: string }> = [
    { label: 'Open', value: formatCurrency(quote.open, currency) },
    { label: 'Prev Close', value: formatCurrency(quote.previousClose, currency) },
    {
      label: 'Volume',
      value: quote.volume ? (
        <LiveValue symbol={quote.symbol} field="volume" value={quote.volume} format={formatNumber} flash={false} />
      ) : (
        'N/A'
      ),
    },
    { label: 'Market Cap', value: quote.marketCap ? formatNumber(quote.marketCap) : 'N/A' },
    { label: 'P/E', value: quote.peRatio ? quote.peRatio.toFixed(1) : 'N/A' },
    { label: 'EPS', value: quote.eps ? formatCurrency(quote.eps, currency) : 'N/A' },
    { label: 'Div Yield', value: quote.dividendYield !== undefined ? `${quote.dividendYield.toFixed(2)}%` : 'N/A', tone: 'text-up' },
    { label: 'Beta', value: quote.beta ? quote.beta.toFixed(2) : 'N/A' },
    { label: '52W High', value: quote.fiftyTwoWeekHigh ? formatCurrency(quote.fiftyTwoWeekHigh, currency) : 'N/A' },
    { label: '52W Low', value: quote.fiftyTwoWeekLow ? formatCurrency(quote.fiftyTwoWeekLow, currency) : 'N/A' },
  ];

  return (
    <section className="qf-panel overflow-hidden">
      <div className="flex flex-col gap-4 p-4 xl:flex-row xl:items-center xl:justify-between">
        {/* Identity + live price */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl font-bold tracking-tight text-fg">{quote.symbol}</h1>
            <span className="rounded border border-line bg-raised px-1.5 py-0.5 font-mono text-2xs font-semibold text-fg-muted">{quote.exchange}</span>
            {quote.currency && (
              <span className="rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-mono text-2xs font-semibold text-accent">{quote.currency}</span>
            )}
            {quote.sector && <span className="hidden rounded bg-raised px-1.5 py-0.5 text-2xs text-fg-subtle sm:inline">{quote.sector}</span>}
            <MarketStatusBadge status={quote.marketStatus} isMock={quote.isMock} />
          </div>
          <p className="mt-0.5 truncate text-xs text-fg-subtle">{quote.name}</p>

          <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
            <LiveValue
              symbol={quote.symbol}
              value={quote.price}
              format={(v) => formatCurrency(v, currency)}
              className="text-[34px] font-semibold leading-none tracking-tight text-fg"
            />
            <div
              className={cn(
                'mb-1 flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs font-semibold ring-1 ring-inset transition-colors duration-300',
                isPositiveDaily ? 'bg-up/10 text-up ring-up/25' : 'bg-down/10 text-down ring-down/25',
              )}
            >
              {isPositiveDaily ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              <span className="num">{formatSigned(dailyChange)}</span>
              <span className="num">({formatSignedPercent(dailyChangePercent)})</span>
            </div>
          </div>

          {/* Day range bar */}
          <div className="mt-3 max-w-sm">
            <div className="flex justify-between font-mono text-3xs uppercase tracking-wider text-fg-subtle">
              <span>
                Low <span className="num text-down">{formatCurrency(lo, currency)}</span>
              </span>
              <span>Day range</span>
              <span>
                High <span className="num text-up">{formatCurrency(hi, currency)}</span>
              </span>
            </div>
            <div className="relative mt-1.5 h-1 rounded-full bg-gradient-to-r from-down/50 via-line-strong to-up/50">
              <span
                className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg bg-accent shadow-[0_0_10px_rgb(var(--qf-accent)/0.8)] transition-[left] duration-500 ease-terminal"
                style={{ left: `${Math.max(0, Math.min(1, rangePos)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Statistics grid */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="min-w-[104px] bg-surface px-3 py-2">
              <div className="font-mono text-3xs font-semibold uppercase tracking-wider text-fg-subtle">{s.label}</div>
              <div className={cn('num mt-0.5 text-xs font-semibold', s.tone ?? 'text-fg')}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
