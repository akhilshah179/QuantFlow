import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CalendarDays } from 'lucide-react';
import { useEconomicCalendar } from '../services/queries';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { Segmented } from '../components/ui/Segmented';
import { EmptyState, SkeletonRows } from '../components/ui/misc';
import { cn } from '../utils/cn';

type ImpactFilter = 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW';

const IMPACT_STYLE: Record<string, { pill: string; bars: number }> = {
  HIGH: { pill: 'bg-down/10 text-down ring-down/25', bars: 3 },
  MEDIUM: { pill: 'bg-accent/10 text-accent ring-accent/25', bars: 2 },
  LOW: { pill: 'bg-raised text-fg-muted ring-line', bars: 1 },
};

export const EconomicCalendarPage: React.FC = () => {
  const { data: events = [], isLoading } = useEconomicCalendar();
  const [impact, setImpact] = useState<ImpactFilter>('ALL');
  const rows = useMemo(() => (impact === 'ALL' ? events : events.filter((e) => e.importance === impact)), [events, impact]);

  return (
    <div className="space-y-4">
      <PageHeader
        icon={CalendarDays}
        eyebrow="Research / Calendar"
        title="Global Economic Calendar"
        subtitle="Scheduled high-impact macroeconomic indicators & central bank rate decisions"
        actions={
          <Segmented
            id="impact"
            size="xs"
            value={impact}
            onChange={setImpact}
            options={[
              { value: 'ALL', label: 'All' },
              { value: 'HIGH', label: 'High' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'LOW', label: 'Low' },
            ]}
          />
        }
      />

      <Panel bodyClassName="p-0">
        {isLoading ? (
          <SkeletonRows rows={6} className="p-3.5" />
        ) : rows.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No scheduled events." className="m-3.5" />
        ) : (
          <div className="overflow-x-auto">
            <table className="qf-table">
              <thead>
                <tr>
                  <th>Country</th>
                  <th>Time</th>
                  <th>Event</th>
                  <th>Impact</th>
                  <th className="text-right">Actual</th>
                  <th className="text-right">Forecast</th>
                  <th className="text-right">Previous</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((ev, i) => {
                  const style = IMPACT_STYLE[ev.importance] ?? IMPACT_STYLE.LOW;
                  return (
                    <motion.tr
                      key={ev.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i, 12) * 0.025 }}
                    >
                      <td>
                        <span className="flex items-center gap-2">
                          <span className="text-sm">{ev.countryFlag}</span>
                          <span className="font-semibold text-fg">{ev.country}</span>
                        </span>
                      </td>
                      <td className="num text-fg-muted">{ev.time}</td>
                      <td className="font-sans font-medium text-fg">{ev.event}</td>
                      <td>
                        <span className={cn('inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-3xs font-bold ring-1 ring-inset', style.pill)}>
                          <span className="flex items-end gap-px">
                            {[1, 2, 3].map((b) => (
                              <span key={b} className={cn('w-[3px] rounded-sm bg-current', b > style.bars && 'opacity-25')} style={{ height: 3 + b * 2 }} />
                            ))}
                          </span>
                          {ev.importance}
                        </span>
                      </td>
                      <td className="num text-right font-semibold text-up">{ev.actual || '—'}</td>
                      <td className="num text-right text-fg">{ev.forecast || '—'}</td>
                      <td className="num text-right text-fg-subtle">{ev.previous || '—'}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
};
