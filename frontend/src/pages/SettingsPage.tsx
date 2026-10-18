import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { useChartStore } from '../store/chartStore';
import { Settings as SettingsIcon, Shield, Sliders, CheckCircle2, Check } from 'lucide-react';
import { Timeframe } from '../types/stock';
import { IndicatorType } from '../types/chart';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { Segmented } from '../components/ui/Segmented';
import { FieldLabel } from '../components/ui/misc';
import { INDICATOR_COLORS } from '../charts/FinancialChart';
import { cn } from '../utils/cn';

const INDICATOR_OPTIONS: { id: IndicatorType; label: string }[] = [
  { id: 'SMA_20', label: 'SMA 20' },
  { id: 'SMA_50', label: 'SMA 50' },
  { id: 'EMA_12', label: 'EMA 12' },
  { id: 'EMA_26', label: 'EMA 26' },
  { id: 'BB_20', label: 'Bollinger Bands' },
  { id: 'RSI_14', label: 'RSI 14' },
];

export const SettingsPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const timeframe = useChartStore((s) => s.timeframe);
  const setTimeframe = useChartStore((s) => s.setTimeframe);
  const activeIndicators = useChartStore((s) => s.activeIndicators);
  const toggleIndicator = useChartStore((s) => s.toggleIndicator);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-4">
      <PageHeader
        icon={SettingsIcon}
        eyebrow="Terminal / Settings"
        title="User & Terminal Settings"
        subtitle="Manage profile details, default chart timeframes & technical indicators"
      />

      <form onSubmit={handleSave} className="space-y-4">
        <Panel title="Profile Account Information" icon={Shield} iconTone="up">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Full Name</FieldLabel>
              <input type="text" disabled value={user?.name || ''} className="qf-input cursor-not-allowed opacity-70" />
            </div>
            <div>
              <FieldLabel>Email Address</FieldLabel>
              <input type="email" disabled value={user?.email || ''} className="qf-input cursor-not-allowed opacity-70" />
            </div>
          </div>
        </Panel>

        <Panel title="Default Chart & Indicator Settings" icon={Sliders}>
          <div className="space-y-4">
            <div>
              <FieldLabel>Default Chart Timeframe</FieldLabel>
              <div className="overflow-x-auto scrollbar-none">
                <Segmented
                  id="settings-tf"
                  value={timeframe}
                  onChange={setTimeframe}
                  options={(['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W', '1M'] as Timeframe[]).map((tf) => ({ value: tf, label: tf }))}
                />
              </div>
            </div>

            <div>
              <FieldLabel>Enabled Default Technical Indicators</FieldLabel>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {INDICATOR_OPTIONS.map((ind) => {
                  const isActive = activeIndicators.includes(ind.id);
                  return (
                    <button
                      key={ind.id}
                      type="button"
                      onClick={() => toggleIndicator(ind.id)}
                      aria-pressed={isActive}
                      className={cn(
                        'flex items-center justify-between rounded-md border p-2.5 text-left font-mono text-xs transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98]',
                        isActive ? 'border-accent/40 bg-accent/[0.07] text-fg' : 'border-line bg-bg/40 text-fg-muted hover:border-line-strong hover:text-fg',
                      )}
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <span className="h-2 w-2 rounded-full" style={{ background: INDICATOR_COLORS[ind.id] }} />
                        {ind.label}
                      </span>
                      <span
                        className={cn(
                          'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                          isActive ? 'border-accent bg-accent text-accent-fg' : 'border-line-strong',
                        )}
                      >
                        {isActive && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Panel>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" size="md">
            Save Terminal Preferences
          </Button>
          <AnimatePresence>
            {saved && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 font-mono text-xs font-semibold text-up"
              >
                <CheckCircle2 className="h-4 w-4" />
                Preferences saved successfully!
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </form>
    </div>
  );
};
