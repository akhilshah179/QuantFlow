import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { usePortfolioStore } from '../store/portfolioStore';
import { QuickTradePanel } from '../components/trading/QuickTradePanel';
import { useRealtimeQuote } from '../hooks/useRealtimeQuote';
import { useLivePortfolio } from '../hooks/useLivePortfolio';
import { formatCurrency, formatPrice, formatSignedCurrency, formatSignedPercent } from '../utils/formatters';
import { History, Layers, Zap } from 'lucide-react';
import api from '../services/api';
import { Transaction } from '../types/portfolio';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { LiveValue } from '../components/ui/LiveValue';
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { EmptyState, signTone } from '../components/ui/misc';
import { VirtualTable, VirtualColumn } from '../components/ui/VirtualTable';
import { cn } from '../utils/cn';

const SYMBOLS = [
  { value: 'AAPL', name: 'Apple Inc.' },
  { value: 'TSLA', name: 'Tesla, Inc.' },
  { value: 'NVDA', name: 'NVIDIA Corp.' },
  { value: 'MSFT', name: 'Microsoft Corp.' },
  { value: 'GOOGL', name: 'Alphabet Inc.' },
  { value: 'AMZN', name: 'Amazon.com Inc.' },
  { value: 'META', name: 'Meta Platforms' },
  { value: 'RELIANCE', name: 'Reliance Industries' },
  { value: 'TCS', name: 'Tata Consultancy' },
  { value: 'INFY', name: 'Infosys Limited' },
];

const TX_COLUMNS: VirtualColumn<Transaction>[] = [
  {
    key: 'type',
    header: 'Type',
    width: '72px',
    render: (tx) => (
      <span
        className={cn(
          'rounded px-1.5 py-0.5 text-3xs font-bold ring-1 ring-inset',
          tx.type === 'BUY' ? 'bg-up/10 text-up ring-up/25' : 'bg-down/10 text-down ring-down/25',
        )}
      >
        {tx.type}
      </span>
    ),
  },
  { key: 'symbol', header: 'Symbol', width: 'minmax(80px,1fr)', render: (tx) => <span className="font-semibold text-fg">{tx.symbol}</span> },
  { key: 'price', header: 'Price', width: 'minmax(90px,1fr)', align: 'right', render: (tx) => <span className="num text-fg-muted">{formatCurrency(tx.price)}</span> },
  { key: 'qty', header: 'Qty', width: '64px', align: 'right', render: (tx) => <span className="num text-fg-muted">{tx.quantity}</span> },
  { key: 'total', header: 'Total', width: 'minmax(100px,1fr)', align: 'right', render: (tx) => <span className="num font-semibold text-fg">{formatCurrency(tx.totalAmount)}</span> },
  {
    key: 'pnl',
    header: 'Realized P/L',
    width: 'minmax(100px,1fr)',
    align: 'right',
    render: (tx) =>
      tx.type === 'SELL' ? (
        <span className={cn('num font-semibold', signTone(tx.realizedPnL))}>{formatSignedCurrency(tx.realizedPnL)}</span>
      ) : (
        <span className="text-fg-subtle">—</span>
      ),
  },
  {
    key: 'time',
    header: 'Time',
    width: '96px',
    align: 'right',
    render: (tx) => <span className="num text-fg-subtle">{new Date(tx.createdAt).toLocaleTimeString()}</span>,
  },
];

export const PaperTradingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSymbol, setSelectedSymbol] = useState<string>('AAPL');
  const [stockQuote, setStockQuote] = useState<any>(null);

  const summary = usePortfolioStore((s) => s.summary);
  const transactions = usePortfolioStore((s) => s.transactions);
  const fetchPortfolio = usePortfolioStore((s) => s.fetchPortfolio);
  const fetchTransactions = usePortfolioStore((s) => s.fetchTransactions);
  const realtimeTick = useRealtimeQuote(selectedSymbol);
  const live = useLivePortfolio();

  useEffect(() => {
    fetchPortfolio();
    fetchTransactions();
  }, [fetchPortfolio, fetchTransactions]);

  useEffect(() => {
    api.get(`/stocks/${selectedSymbol}`)
      .then((res: any) => setStockQuote(res?.price !== undefined ? res : (res?.data || null)))
      .catch(() => {});
  }, [selectedSymbol]);

  const currentPrice = realtimeTick ? realtimeTick.price : stockQuote ? stockQuote.price : 100;
  const holdings = live?.liveHoldings ?? summary?.holdings ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Zap}
        eyebrow="Trading / Paper"
        title="Paper Trading Desk"
        subtitle="Execute simulated market orders with zero financial risk"
        actions={
          summary && (
            <div className="qf-panel flex items-center gap-4 px-3 py-1.5 font-mono text-2xs">
              <span className="text-fg-subtle">
                CASH{' '}
                <AnimatedNumber value={summary.cashBalance} format={(v) => formatCurrency(v)} tintOnChange className="font-semibold text-up" />
              </span>
              {live && (
                <span className="text-fg-subtle">
                  UNREALIZED{' '}
                  <AnimatedNumber
                    value={live.totalUnrealizedPnL}
                    format={formatSignedCurrency}
                    className={cn('font-semibold', signTone(live.totalUnrealizedPnL))}
                  />
                </span>
              )}
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Symbol picker + order ticket */}
        <div className="space-y-3 lg:col-span-1">
          <Panel title="Instrument" icon={Layers} bodyClassName="p-2">
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-5 lg:grid-cols-2">
              {SYMBOLS.map((s) => {
                const active = s.value === selectedSymbol;
                return (
                  <button
                    key={s.value}
                    onClick={() => setSelectedSymbol(s.value)}
                    className={cn(
                      'relative flex flex-col items-start rounded-md px-2.5 py-1.5 text-left transition-colors duration-150',
                      active ? 'text-fg' : 'text-fg-muted hover:bg-raised/70 hover:text-fg',
                    )}
                    title={`${s.value} - ${s.name}`}
                  >
                    {active && (
                      <motion.span
                        layoutId="paper-symbol"
                        className="absolute inset-0 rounded-md border border-accent/40 bg-accent/10"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                    <span className={cn('relative font-mono text-xs font-semibold', active && 'text-accent')}>{s.value}</span>
                    <span className="relative truncate text-3xs text-fg-subtle">{s.name}</span>
                  </button>
                );
              })}
            </div>
          </Panel>

          <QuickTradePanel symbol={selectedSymbol} currentPrice={currentPrice} />
        </div>

        {/* Positions + log */}
        <div className="space-y-4 lg:col-span-2">
          <Panel title="Open Positions" icon={Layers} bodyClassName="p-0" meta={<span className="num font-mono text-3xs text-fg-subtle">{holdings.length}</span>}>
            {holdings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="qf-table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th className="text-right">Qty</th>
                      <th className="text-right">Avg Price</th>
                      <th className="text-right">Last</th>
                      <th className="text-right">Value</th>
                      <th className="text-right">Unrealized P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {holdings.map((h) => (
                        <motion.tr
                          key={h.id}
                          layout="position"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setSelectedSymbol(h.symbol)}
                          className="cursor-pointer"
                        >
                          <td>
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/stocks/${h.symbol}`); }} className="font-semibold text-fg hover:text-accent">
                              {h.symbol}
                            </button>
                          </td>
                          <td className="num text-right text-fg-muted">{h.quantity}</td>
                          <td className="num text-right text-fg-muted">{formatCurrency(h.averageBuyPrice)}</td>
                          <td className="text-right">
                            <LiveValue symbol={h.symbol} value={h.currentPrice} format={(v) => formatPrice(v)} className="text-fg" />
                          </td>
                          <td className="text-right">
                            <AnimatedNumber value={h.currentValue} format={(v) => formatCurrency(v)} duration={0.4} className="font-semibold text-fg" />
                          </td>
                          <td className="text-right">
                            <span className={cn('num inline-flex items-center gap-1.5 font-semibold', signTone(h.unrealizedPnL))}>
                              <AnimatedNumber value={h.unrealizedPnL} format={formatSignedCurrency} duration={0.4} tintOnChange />
                              <span className="text-[11px] opacity-80">{formatSignedPercent(h.unrealizedPnLPercent)}</span>
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={Layers} title="No active positions." hint="Execute a BUY order to open a position." className="m-3.5" />
            )}
          </Panel>

          <Panel
            title="Execution Log"
            icon={History}
            bodyClassName="p-0"
            meta={<span className="num font-mono text-3xs text-fg-subtle">{transactions.length} fills</span>}
          >
            {transactions && transactions.length > 0 ? (
              <VirtualTable rows={transactions} columns={TX_COLUMNS} rowKey={(tx) => tx.id} maxHeight={320} minWidth={640} />
            ) : (
              <EmptyState icon={History} title="No orders executed yet." className="m-3.5" />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
};
