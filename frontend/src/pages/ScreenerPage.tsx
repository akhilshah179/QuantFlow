import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StockQuote } from '../types/stock';
import { formatCurrency, formatNumber, formatSignedPercent } from '../utils/formatters';
import { MarketStatusBadge } from '../components/common/MarketStatusBadge';
import { Search, RotateCcw, SlidersHorizontal, ChevronDown, ScanSearch } from 'lucide-react';
import { useScreener } from '../services/queries';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { LiveValue } from '../components/ui/LiveValue';
import { EmptyState, FieldLabel, SkeletonRows } from '../components/ui/misc';
import { VirtualTable, VirtualColumn } from '../components/ui/VirtualTable';
import { subscribeOnce } from '../components/stream/useStreamData';

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ children, ...rest }) => (
  <div className="relative">
    <select {...rest} className="qf-input cursor-pointer appearance-none pr-8 font-semibold">
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
  </div>
);

export const ScreenerPage: React.FC = () => {
  const navigate = useNavigate();

  // Screener Filters
  const [exchange, setExchange] = useState<string>('ALL');
  const [sector, setSector] = useState<string>('ALL');
  const [maxPeRatio, setMaxPeRatio] = useState<string>('');
  const [minDividendYield, setMinDividendYield] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  // Text search applies on Enter / Search, as before.
  const [appliedQuery, setAppliedQuery] = useState<string>('');

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (exchange !== 'ALL') p.append('exchange', exchange);
    if (sector !== 'ALL') p.append('sector', sector);
    if (maxPeRatio) p.append('maxPeRatio', maxPeRatio);
    if (minDividendYield) p.append('minDividendYield', minDividendYield);
    if (appliedQuery) p.append('query', appliedQuery);
    return p.toString();
  }, [exchange, sector, maxPeRatio, minDividendYield, appliedQuery]);

  const { data: stocks = [], isLoading, isFetching } = useScreener(params);

  useEffect(() => {
    subscribeOnce(stocks.slice(0, 60).map((s) => s.symbol));
  }, [stocks]);

  const handleReset = () => {
    setExchange('ALL');
    setSector('ALL');
    setMaxPeRatio('');
    setMinDividendYield('');
    setQuery('');
    setAppliedQuery('');
  };

  const columns: VirtualColumn<StockQuote>[] = [
    {
      key: 'symbol',
      header: 'Symbol',
      width: 'minmax(150px,1.6fr)',
      render: (s) => (
        <span className="block min-w-0">
          <span className="block font-semibold text-fg group-hover:text-accent">{s.symbol}</span>
          <span className="block truncate font-sans text-3xs text-fg-subtle">{s.name}</span>
        </span>
      ),
    },
    { key: 'exchange', header: 'Exchange', width: '90px', render: (s) => <span className="text-fg-muted">{s.exchange}</span> },
    { key: 'sector', header: 'Sector', width: 'minmax(110px,1fr)', render: (s) => <span className="text-fg-muted">{s.sector || 'N/A'}</span> },
    {
      key: 'price',
      header: 'Price',
      width: 'minmax(96px,1fr)',
      align: 'right',
      render: (s) => <LiveValue symbol={s.symbol} value={s.price} format={(v) => formatCurrency(v, s.currency)} className="font-semibold text-fg" />,
    },
    {
      key: 'chg',
      header: 'Chg %',
      width: '92px',
      align: 'right',
      render: (s) => <LiveValue symbol={s.symbol} field="changePercent" value={s.changePercent} format={formatSignedPercent} pill className="text-[11px] font-semibold" />,
    },
    { key: 'mcap', header: 'Mkt Cap', width: '90px', align: 'right', render: (s) => <span className="num text-fg-muted">{s.marketCap ? formatNumber(s.marketCap) : 'N/A'}</span> },
    { key: 'pe', header: 'P/E', width: '64px', align: 'right', render: (s) => <span className="num text-fg-muted">{s.peRatio ? s.peRatio.toFixed(1) : 'N/A'}</span> },
    { key: 'eps', header: 'EPS', width: '80px', align: 'right', render: (s) => <span className="num text-fg-muted">{s.eps ? formatCurrency(s.eps, s.currency) : 'N/A'}</span> },
    {
      key: 'div',
      header: 'Div Yld',
      width: '72px',
      align: 'right',
      render: (s) => <span className="num text-up">{s.dividendYield !== undefined ? `${s.dividendYield.toFixed(2)}%` : 'N/A'}</span>,
    },
    { key: 'status', header: 'Status', width: '150px', render: (s) => <MarketStatusBadge status={s.marketStatus} /> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={SlidersHorizontal}
        eyebrow="Research / Screener"
        title="Equity Screener Workstation"
        subtitle="Filter equities across global exchanges by valuation multiples, sector, and yield"
      />

      <Panel title="Filters" icon={SlidersHorizontal} actions={
        <Button size="xs" variant="ghost" onClick={handleReset}>
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
      }>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <FieldLabel>Exchange</FieldLabel>
            <Select value={exchange} onChange={(e) => setExchange(e.target.value)}>
              <option value="ALL">All Exchanges</option>
              <option value="NASDAQ">NASDAQ</option>
              <option value="NYSE">NYSE</option>
              <option value="NSE">NSE (India)</option>
              <option value="LSE">LSE (London)</option>
              <option value="DAX">DAX (Germany)</option>
              <option value="Nikkei">Nikkei (Japan)</option>
              <option value="HKEX">HKEX (Hong Kong)</option>
            </Select>
          </div>
          <div>
            <FieldLabel>Sector</FieldLabel>
            <Select value={sector} onChange={(e) => setSector(e.target.value)}>
              <option value="ALL">All Sectors</option>
              <option value="Technology">Technology</option>
              <option value="Energy">Energy</option>
              <option value="Consumer Cyclical">Consumer Cyclical</option>
              <option value="Communication Services">Communication Services</option>
              <option value="Financial Services">Financial Services</option>
            </Select>
          </div>
          <div>
            <FieldLabel>Max P/E Ratio</FieldLabel>
            <input type="number" placeholder="e.g. 35" value={maxPeRatio} onChange={(e) => setMaxPeRatio(e.target.value)} className="qf-input num" />
          </div>
          <div>
            <FieldLabel>Min Div Yield (%)</FieldLabel>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 0.5"
              value={minDividendYield}
              onChange={(e) => setMinDividendYield(e.target.value)}
              className="qf-input num"
            />
          </div>
          <div>
            <FieldLabel aside="↵ to apply">Symbol / Name</FieldLabel>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-subtle" />
              <input
                type="text"
                placeholder="Symbol / Name…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setAppliedQuery(query)}
                onBlur={() => setAppliedQuery(query)}
                className="qf-input pl-8"
              />
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        title={`Matching Results`}
        icon={ScanSearch}
        bodyClassName="p-0"
        meta={<span className="num font-mono text-3xs text-fg-subtle">{stocks.length}</span>}
        actions={isFetching && !isLoading ? <span className="font-mono text-3xs uppercase tracking-wider text-accent">Updating…</span> : undefined}
      >
        {isLoading ? (
          <SkeletonRows rows={8} className="p-3.5" />
        ) : stocks.length > 0 ? (
          <div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            <VirtualTable
              rows={stocks}
              columns={columns}
              rowKey={(s) => s.symbol}
              rowHeight={44}
              maxHeight={560}
              minWidth={1070}
              onRowClick={(s) => navigate(`/stocks/${s.symbol}`)}
            />
          </div>
        ) : (
          <EmptyState icon={ScanSearch} title="No stocks matching selected screener criteria." className="m-3.5" />
        )}
      </Panel>
    </div>
  );
};
