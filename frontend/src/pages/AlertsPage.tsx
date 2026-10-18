import React, { memo, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BellRing, Plus, Trash2, CheckCircle2, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { PriceAlert, useAlerts, useCreateAlert, useDeleteAlert } from '../services/queries';
import { useQuote } from '../store/marketStore';
import { notify } from '../store/notificationStore';
import { subscribeOnce } from '../components/stream/useStreamData';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { Segmented } from '../components/ui/Segmented';
import { EmptyState, FieldLabel, LiveDot, SkeletonRows } from '../components/ui/misc';
import { formatPrice } from '../utils/formatters';
import { cn } from '../utils/cn';

/** One alert row — subscribes to its own symbol so ticks elsewhere don't touch it. */
const AlertRow: React.FC<{ alt: PriceAlert; onDelete: (id: string) => void; index: number }> = memo(({ alt, onDelete, index }) => {
  const quote = useQuote(alt.symbol);
  const target = Number(alt.targetPrice);
  const price = quote?.price;
  const above = alt.condition === 'ABOVE';
  const distancePct = price ? ((target - price) / price) * 100 : undefined;
  // Proximity: 100% when price sits on the target, fades out over a 5% gap.
  const proximity = distancePct === undefined ? 0 : Math.max(0, 1 - Math.abs(distancePct) / 5);

  return (
    <motion.tr
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 12, transition: { duration: 0.15 } }}
      transition={{ delay: Math.min(index, 10) * 0.03, duration: 0.2 }}
      className="group"
    >
      <td className="font-semibold text-fg">${alt.symbol}</td>
      <td>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-3xs font-bold ring-1 ring-inset',
            above ? 'bg-up/10 text-up ring-up/25' : 'bg-down/10 text-down ring-down/25',
          )}
        >
          {above ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {alt.condition}
        </span>
      </td>
      <td className="num text-right font-semibold text-fg">${target.toFixed(2)}</td>
      <td className="num text-right text-fg-muted">{price !== undefined ? formatPrice(price) : '—'}</td>
      <td className="min-w-[140px]">
        {alt.isActive && distancePct !== undefined ? (
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-line">
              <motion.div
                className="h-full rounded-full bg-accent"
                animate={{ width: `${proximity * 100}%` }}
                transition={{ type: 'spring', stiffness: 200, damping: 30 }}
              />
            </div>
            <span className="num w-14 text-right text-2xs text-fg-subtle">{Math.abs(distancePct).toFixed(2)}%</span>
          </div>
        ) : (
          <span className="text-2xs text-fg-subtle">—</span>
        )}
      </td>
      <td>
        {alt.isActive ? (
          <span className="flex items-center gap-1.5 text-2xs font-semibold text-accent">
            <LiveDot tone="accent" />
            ARMED
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-2xs font-semibold text-up">
            <CheckCircle2 className="h-3.5 w-3.5" />
            TRIGGERED
          </span>
        )}
      </td>
      <td className="text-right">
        <button
          onClick={() => onDelete(alt.id)}
          className="rounded p-1.5 text-fg-subtle opacity-60 transition-[opacity,color,background-color] hover:bg-down/10 hover:text-down group-hover:opacity-100"
          aria-label={`Delete alert for ${alt.symbol}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </td>
    </motion.tr>
  );
});
AlertRow.displayName = 'AlertRow';

export const AlertsPage: React.FC = () => {
  const { data: alerts = [], isLoading } = useAlerts();
  const createAlert = useCreateAlert();
  const deleteAlert = useDeleteAlert();

  const [showModal, setShowModal] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    subscribeOnce(alerts.map((a) => a.symbol));
  }, [alerts]);

  useEffect(() => {
    if (!showModal) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setShowModal(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showModal]);

  const handleDelete = (id: string) => {
    deleteAlert.mutate(id);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !targetPrice) return;
    setFormError(null);
    createAlert.mutate(
      { symbol, targetPrice: parseFloat(targetPrice), condition },
      {
        onSuccess: () => {
          notify({ tone: 'info', title: `Alert armed · ${symbol.toUpperCase()}`, message: `${condition === 'ABOVE' ? '≥' : '≤'} $${parseFloat(targetPrice).toFixed(2)}` });
          setShowModal(false);
          setSymbol('');
          setTargetPrice('');
        },
        onError: (err: any) => setFormError(err.message || 'Failed to create price alert'),
      },
    );
  };

  const armed = alerts.filter((a) => a.isActive).length;

  return (
    <div className="space-y-4">
      <PageHeader
        icon={BellRing}
        eyebrow="Trading / Alerts"
        title="Market Price Alerts Engine"
        subtitle="Real-time WebSocket price threshold trigger notifications"
        actions={
          <>
            <div className="qf-panel flex items-center gap-3 px-3 py-1.5 font-mono text-2xs">
              <span className="text-fg-subtle">
                ARMED <span className="num font-semibold text-accent">{armed}</span>
              </span>
              <span className="text-fg-subtle">
                TRIGGERED <span className="num font-semibold text-up">{alerts.length - armed}</span>
              </span>
            </div>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              <Plus className="h-3.5 w-3.5" />
              Create Alert
            </Button>
          </>
        }
      />

      <Panel bodyClassName="p-0">
        {isLoading ? (
          <SkeletonRows rows={4} className="p-3.5" />
        ) : alerts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="qf-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Condition</th>
                  <th className="text-right">Target</th>
                  <th className="text-right">Last</th>
                  <th>Proximity</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {alerts.map((alt, i) => (
                    <AlertRow key={alt.id} alt={alt} index={i} onDelete={handleDelete} />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={BellRing}
            title="No active market alerts."
            hint='Click "Create Alert" to set price threshold monitors.'
            className="m-3.5"
          />
        )}
      </Panel>

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 460, damping: 34 }}
              className="w-full max-w-md overflow-hidden rounded-xl border border-line-strong bg-overlay shadow-pop"
            >
              <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
                <BellRing className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-semibold text-fg">Create Market Price Alert</h2>
              </div>
              <form onSubmit={handleCreate} className="space-y-4 p-5">
                <div>
                  <FieldLabel htmlFor="alert-symbol">Symbol</FieldLabel>
                  <input
                    id="alert-symbol"
                    type="text"
                    placeholder="e.g. AAPL, TSLA, BTCUSD"
                    className="qf-input uppercase"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <FieldLabel>Condition</FieldLabel>
                  <Segmented
                    id="alert-cond"
                    stretch
                    tone={condition === 'ABOVE' ? 'up' : 'down'}
                    value={condition}
                    onChange={setCondition}
                    options={[
                      { value: 'ABOVE', label: <><ArrowUp className="h-3 w-3" /> Breaks above (≥)</> },
                      { value: 'BELOW', label: <><ArrowDown className="h-3 w-3" /> Drops below (≤)</> },
                    ]}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="alert-target">Target Price ($)</FieldLabel>
                  <input
                    id="alert-target"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 250.00"
                    className="qf-input num"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    required
                  />
                </div>

                <AnimatePresence>
                  {formError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-start gap-2 rounded-md border border-down/30 bg-down/10 p-2 text-xs text-down">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {formError}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" loading={createAlert.isPending}>
                    Set Price Alert
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
