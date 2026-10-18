import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { FinancialChart } from '../../charts/FinancialChart';
import { AssetClass, useMarketOverview, useStockHistory } from '../../services/queries';
import { useQuote } from '../../store/marketStore';
import { AssetKind, formatPrice, formatSignedPercent } from '../../utils/formatters';
import { Timeframe } from '../../types/stock';
import { IndicatorType } from '../../types/chart';
import { PageHeader } from '../ui/PageHeader';
import { Panel } from '../ui/Panel';
import { LiveValue } from '../ui/LiveValue';
import { Segmented } from '../ui/Segmented';
import { SkeletonRows } from '../ui/misc';
import { cn } from '../../utils/cn';

export interface WorkstationItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

interface AssetWorkstationProps {
  asset: Exclude<AssetClass, 'stocks'>;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  subtitle: string;
  badge: string;
  listTitle: string;
  defaultSymbol: string;
  /** Used only if the overview endpoint returns nothing. */
  fallbackItems: WorkstationItem[];
}

const TIMEFRAMES: Timeframe[] = ['1H', '4H', '1D', '1W'];
const INDICATORS: IndicatorType[] = ['SMA_20', 'RSI_14'];
const KIND: Record<AssetWorkstationProps['asset'], AssetKind> = { crypto: 'crypto', forex: 'forex', futures: 'futures' };

export const AssetWorkstation: React.FC<AssetWorkstationProps> = ({
  asset,
  icon,
  eyebrow,
  title,
  subtitle,
  badge,
  listTitle,
  defaultSymbol,
  fallbackItems,
}) => {
  const [params, setParams] = useSearchParams();
  const selected = (params.get('symbol') || defaultSymbol).toUpperCase();
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const kind = KIND[asset];

  const overview = useMarketOverview(asset);
  const history = useStockHistory(selected, timeframe);
  // Reads a tick if one exists; these pages don't open socket subscriptions (as before).
  const tick = useQuote(selected) ?? null;

  const items: WorkstationItem[] = useMemo(() => {
    const d = overview.data;
    if (!d) return overview.isLoading ? [] : fallbackItems;
    const seen = new Set<string>();
    const out: WorkstationItem[] = [];
    d.indices?.forEach((i) => {
      if (!seen.has(i.symbol)) {
        seen.add(i.symbol);
        out.push({ symbol: i.symbol, name: i.name, price: i.value, change: i.changePercent });
      }
    });
    [...(d.topGainers || []), ...(d.mostActive || []), ...(d.topLosers || [])].forEach((q) => {
      if (!seen.has(q.symbol)) {
        seen.add(q.symbol);
        out.push({ symbol: q.symbol, name: q.name, price: q.price, change: q.changePercent });
      }
    });
    return out.length ? out : fallbackItems;
  }, [overview.data, overview.isLoading, fallbackItems]);

  const current = items.find((i) => i.symbol === selected);
  const advancers = items.filter((i) => i.change > 0).length;
  const decliners = items.filter((i) => i.change < 0).length;
  const avgChange = items.length ? items.reduce((s, i) => s + i.change, 0) / items.length : 0;
  const best = items.reduce<WorkstationItem | undefined>((b, i) => (!b || i.change > b.change ? i : b), undefined);

  const select = (symbol: string) => setParams({ symbol }, { replace: true });

  return (
    <div className="space-y-4">
      <PageHeader
        icon={icon}
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        actions={
          items.length > 0 && (
            <div className="qf-panel grid grid-cols-3 divide-x divide-line font-mono text-2xs">
              <div className="px-3 py-1.5">
                <div className="text-3xs uppercase tracking-wider text-fg-subtle">Breadth</div>
                <div className="num font-semibold">
                  <span className="text-up">{advancers}▲</span> <span className="text-down">{decliners}▼</span>
                </div>
              </div>
              <div className="px-3 py-1.5">
                <div className="text-3xs uppercase tracking-wider text-fg-subtle">Avg Chg</div>
                <div className={cn('num font-semibold', avgChange >= 0 ? 'text-up' : 'text-down')}>{formatSignedPercent(avgChange)}</div>
              </div>
              <div className="px-3 py-1.5">
                <div className="text-3xs uppercase tracking-wider text-fg-subtle">Leader</div>
                <div className="num truncate font-semibold text-fg">{best?.symbol ?? '—'}</div>
              </div>
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Chart */}
        <Panel
          className="lg:col-span-2"
          bodyClassName="p-3"
          title={
            <span className="flex items-center gap-2 normal-case tracking-normal">
              <span className="font-mono text-sm font-bold text-fg">{selected}</span>
              <span className="rounded bg-accent/10 px-1.5 py-0.5 text-3xs font-bold uppercase tracking-wider text-accent">{badge}</span>
            </span>
          }
          actions={<Segmented id={`tf-${asset}`} size="xs" value={timeframe} onChange={setTimeframe} options={TIMEFRAMES.map((t) => ({ value: t, label: t }))} />}
        >
          <div className="mb-3 flex items-baseline gap-3">
            <LiveValue
              symbol={selected}
              value={current?.price ?? history.data?.candles?.[history.data.candles.length - 1]?.close}
              format={(v) => formatPrice(v, kind)}
              className="text-2xl font-semibold tracking-tight text-fg"
            />
            <LiveValue symbol={selected} field="changePercent" value={current?.change} format={formatSignedPercent} pill className="text-xs font-semibold" />
          </div>
          <div className="h-[420px] w-full sm:h-[460px]">
            <FinancialChart
              symbol={selected}
              candles={history.data?.candles ?? []}
              chartType="candlestick"
              indicators={INDICATORS}
              indicatorData={history.data?.indicators}
              timeframe={timeframe}
              realtimeTick={history.isPlaceholderData ? null : tick}
              loading={history.isFetching}
            />
          </div>
        </Panel>

        {/* Instrument list */}
        <Panel title={listTitle} icon={icon} bodyClassName="p-1.5">
          {overview.isLoading ? (
            <SkeletonRows rows={6} className="p-2" />
          ) : (
            <div className="space-y-0.5">
              {items.map((it) => {
                const active = it.symbol === selected;
                return (
                  <button
                    key={it.symbol}
                    onClick={() => select(it.symbol)}
                    className={cn(
                      'group relative flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left font-mono transition-colors duration-150',
                      !active && 'hover:bg-raised/70',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId={`asset-active-${asset}`}
                        className="absolute inset-0 rounded-md border border-accent/35 bg-accent/[0.07]"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                    <span className="relative min-w-0">
                      <span className={cn('block text-xs font-semibold', active ? 'text-accent' : 'text-fg')}>{it.symbol}</span>
                      <span className="block truncate font-sans text-3xs text-fg-subtle">{it.name}</span>
                    </span>
                    <span className="relative text-right">
                      <LiveValue symbol={it.symbol} value={it.price} format={(v) => formatPrice(v, kind)} className="block text-xs font-semibold text-fg" />
                      <LiveValue symbol={it.symbol} field="changePercent" value={it.change} format={formatSignedPercent} signed className="block text-[11px]" />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
};
