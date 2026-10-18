import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, BellRing, CheckCircle2 } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import { useAlerts } from '../../services/queries';
import { NOTICE_STYLE } from '../ui/Toaster';
import { cn } from '../../utils/cn';

function timeAgo(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export const NotificationCenter: React.FC = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const history = useNotificationStore((s) => s.history);
  const unread = useNotificationStore((s) => s.unread);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const clearHistory = useNotificationStore((s) => s.clearHistory);
  const { data: alerts = [] } = useAlerts();
  const triggered = alerts.filter((a) => !a.isActive);
  const armed = alerts.length - triggered.length;

  useEffect(() => {
    if (!open) return;
    markAllRead();
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, markAllRead]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'relative flex h-8 w-8 items-center justify-center rounded-md border transition-colors',
          open ? 'border-line-strong bg-raised text-fg' : 'border-transparent text-fg-muted hover:bg-raised hover:text-fg',
        )}
        aria-label="Notifications"
      >
        <motion.span
          key={unread}
          initial={unread > 0 ? { rotate: -18 } : false}
          animate={{ rotate: 0 }}
          transition={{ type: 'spring', stiffness: 600, damping: 12 }}
          className="flex"
        >
          {unread > 0 ? <BellRing className="h-4 w-4 text-accent" /> : <Bell className="h-4 w-4" />}
        </motion.span>
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="num absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-3xs font-bold text-accent-fg"
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 520, damping: 36 }}
            style={{ transformOrigin: 'top right' }}
            className="absolute right-0 top-10 z-50 w-[min(340px,calc(100vw-24px))] overflow-hidden rounded-lg border border-line-strong bg-overlay shadow-pop"
          >
            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <span className="qf-label text-fg">Notifications</span>
              {history.length > 0 && (
                <button onClick={clearHistory} className="font-mono text-2xs text-fg-subtle hover:text-fg">
                  Clear
                </button>
              )}
            </div>

            <Link
              to="/alerts"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between border-b border-line bg-raised/50 px-3 py-2 text-xs transition-colors hover:bg-raised"
            >
              <span className="flex items-center gap-2 text-fg-muted">
                <BellRing className="h-3.5 w-3.5 text-accent" />
                Price alerts
              </span>
              <span className="num flex items-center gap-2 text-2xs">
                <span className="text-fg">{armed} armed</span>
                <span className="text-fg-subtle">·</span>
                <span className={triggered.length ? 'text-up' : 'text-fg-subtle'}>{triggered.length} triggered</span>
              </span>
            </Link>

            <div className="max-h-[320px] overflow-y-auto">
              {triggered.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-start gap-2.5 border-b border-line/60 px-3 py-2.5">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-up" />
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-mono font-semibold text-fg">
                      {a.symbol} crossed {a.condition === 'ABOVE' ? '≥' : '≤'} {Number(a.targetPrice).toFixed(2)}
                    </p>
                    <p className="text-fg-subtle">Alert triggered{a.triggeredAt ? ` · ${new Date(a.triggeredAt).toLocaleString()}` : ''}</p>
                  </div>
                </div>
              ))}
              {history.map((n) => {
                const style = NOTICE_STYLE[n.tone];
                const Icon = style.icon;
                return (
                  <div key={n.id} className="flex items-start gap-2.5 border-b border-line/60 px-3 py-2.5 last:border-0">
                    <Icon className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', style.tone)} />
                    <div className="min-w-0 flex-1 text-xs">
                      <p className="font-mono font-semibold text-fg">{n.title}</p>
                      {n.message && <p className="truncate text-fg-subtle">{n.message}</p>}
                    </div>
                    <span className="num shrink-0 text-3xs text-fg-subtle">{timeAgo(n.createdAt)}</span>
                  </div>
                );
              })}
              {history.length === 0 && triggered.length === 0 && (
                <p className="px-3 py-8 text-center font-mono text-xs text-fg-subtle">No notifications this session.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
