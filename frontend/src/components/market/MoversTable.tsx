import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronRight, LucideIcon } from 'lucide-react';
import { StockQuote } from '../../types/stock';
import { formatCurrency, formatNumber, formatSignedPercent } from '../../utils/formatters';
import { LiveValue } from '../ui/LiveValue';
import { Panel } from '../ui/Panel';
import { SkeletonRows } from '../ui/misc';
import { cn } from '../../utils/cn';

interface MoversTableProps {
  title: string;
  icon: LucideIcon;
  iconTone?: 'accent' | 'up' | 'down';
  rows: StockQuote[] | undefined;
  loading?: boolean;
  /** Show the volume column (most-active list). */
  showVolume?: boolean;
  /** Route for a row; defaults to the stock terminal. */
  hrefFor?: (q: StockQuote) => string;
  className?: string;
}

const MoverRow: React.FC<{ q: StockQuote; maxAbs: number; showVolume?: boolean; onOpen: () => void; index: number }> = memo(
  ({ q, maxAbs, showVolume, onOpen, index }) => {
    const width = maxAbs > 0 ? Math.max(4, (Math.abs(q.changePercent) / maxAbs) * 100) : 0;
    const up = q.changePercent >= 0;
    return (
      <motion.button
        type="button"
        onClick={onOpen}
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.035, duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        className="group relative grid w-full grid-cols-12 items-center gap-2 border-b border-line/50 px-3.5 py-2 text-left font-mono text-xs transition-colors last:border-0 hover:bg-raised/70"
      >
        {/* Relative-move baseline under the row */}
        <span
          aria-hidden
          className={cn('absolute bottom-0 left-0 h-[2px] rounded-r opacity-40 transition-opacity group-hover:opacity-80', up ? 'bg-up' : 'bg-down')}
          style={{ width: `${width}%` }}
        />
        <span className="relative col-span-5 min-w-0">
          <span className="block truncate font-semibold text-fg transition-colors group-hover:text-accent">{q.symbol}</span>
          <span className="block truncate font-sans text-3xs text-fg-subtle">{q.name}</span>
        </span>
        <span className={cn('relative text-right', showVolume ? 'col-span-3' : 'col-span-4')}>
          <LiveValue symbol={q.symbol} value={q.price} format={(v) => formatCurrency(v, q.currency)} className="text-fg" />
        </span>
        {showVolume && (
          <span className="relative col-span-1 hidden text-right text-fg-subtle 2xl:block">
            <LiveValue symbol={q.symbol} field="volume" value={q.volume} format={formatNumber} flash={false} />
          </span>
        )}
        <span className={cn('relative flex items-center justify-end gap-1', showVolume ? 'col-span-4 2xl:col-span-3' : 'col-span-3')}>
          <LiveValue symbol={q.symbol} field="changePercent" value={q.changePercent} format={formatSignedPercent} pill className="text-[11px] font-semibold" />
          <ChevronRight className="h-3 w-3 -translate-x-1 text-fg-subtle opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-x-0 group-hover:opacity-100" />
        </span>
      </motion.button>
    );
  },
);
MoverRow.displayName = 'MoverRow';

export const MoversTable: React.FC<MoversTableProps> = ({ title, icon, iconTone = 'accent', rows, loading, showVolume, hrefFor, className }) => {
  const navigate = useNavigate();
  const list = rows ?? [];
  const maxAbs = list.reduce((m, q) => Math.max(m, Math.abs(q.changePercent || 0)), 0);

  return (
    <Panel
      title={title}
      icon={icon}
      iconTone={iconTone}
      className={className}
      bodyClassName="p-0"
      actions={<span className="font-mono text-3xs uppercase tracking-wider text-fg-subtle">Realtime</span>}
    >
      {loading ? (
        <SkeletonRows rows={5} className="p-3.5" />
      ) : list.length === 0 ? (
        <p className="p-6 text-center font-mono text-xs text-fg-subtle">No instruments to show.</p>
      ) : (
        list.map((q, i) => (
          <MoverRow
            key={q.symbol}
            q={q}
            index={i}
            maxAbs={maxAbs}
            showVolume={showVolume}
            onOpen={() => navigate(hrefFor ? hrefFor(q) : `/stocks/${q.symbol}`)}
          />
        ))
      )}
    </Panel>
  );
};
