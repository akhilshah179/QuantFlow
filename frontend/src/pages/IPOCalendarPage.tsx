import React from 'react';
import { motion } from 'motion/react';
import { CalendarClock, Rocket } from 'lucide-react';
import { useIpoCalendar } from '../services/queries';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState, Skeleton } from '../components/ui/misc';
import { cn } from '../utils/cn';

const STATUS_STYLE: Record<string, string> = {
  UPCOMING: 'bg-info/10 text-info ring-info/25',
  LISTED: 'bg-up/10 text-up ring-up/25',
};

export const IPOCalendarPage: React.FC = () => {
  const { data: listings = [], isLoading } = useIpoCalendar();

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Rocket}
        eyebrow="Research / IPO Calendar"
        title="Upcoming & Recent IPO Calendar"
        subtitle="Initial public offerings, listing dates, and offer price ranges"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState icon={Rocket} title="No IPO listings available." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {listings.map((ipo, i) => (
            <motion.div
              key={ipo.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 9) * 0.04, duration: 0.22 }}
              className="qf-panel group space-y-3 p-4 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-fg">{ipo.company}</div>
                  <div className="mt-0.5 font-mono text-2xs font-semibold text-accent">
                    {ipo.symbol} <span className="text-fg-subtle">· {ipo.exchange}</span>
                  </div>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded px-1.5 py-0.5 font-mono text-3xs font-bold ring-1 ring-inset',
                    STATUS_STYLE[ipo.status] ?? 'bg-accent/10 text-accent ring-accent/25',
                  )}
                >
                  {ipo.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line font-mono text-xs">
                <div className="bg-surface px-2.5 py-2">
                  <div className="flex items-center gap-1 text-3xs uppercase tracking-wider text-fg-subtle">
                    <CalendarClock className="h-3 w-3" /> Listing
                  </div>
                  <div className="mt-0.5 font-semibold text-fg">{ipo.listingDate}</div>
                </div>
                <div className="bg-surface px-2.5 py-2">
                  <div className="text-3xs uppercase tracking-wider text-fg-subtle">Price range</div>
                  <div className="num mt-0.5 font-semibold text-up">{ipo.priceRange}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
