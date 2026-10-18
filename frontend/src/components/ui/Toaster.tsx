import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, Info, X } from 'lucide-react';
import { NoticeTone, useNotificationStore } from '../../store/notificationStore';
import { cn } from '../../utils/cn';

export const NOTICE_STYLE: Record<NoticeTone, { icon: React.ElementType; tone: string; bar: string }> = {
  success: { icon: CheckCircle2, tone: 'text-up', bar: 'bg-up' },
  up: { icon: ArrowUpRight, tone: 'text-up', bar: 'bg-up' },
  down: { icon: ArrowDownRight, tone: 'text-down', bar: 'bg-down' },
  error: { icon: AlertTriangle, tone: 'text-down', bar: 'bg-down' },
  info: { icon: Info, tone: 'text-accent', bar: 'bg-accent' },
};

export const Toaster: React.FC = () => {
  const toasts = useNotificationStore((s) => s.toasts);
  const dismiss = useNotificationStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-10 right-3 z-[70] flex w-[min(360px,calc(100vw-24px))] flex-col gap-2 sm:right-4"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const style = NOTICE_STYLE[t.tone];
          const Icon = style.icon;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 24, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              className="pointer-events-auto relative overflow-hidden rounded-lg border border-line-strong bg-overlay/95 shadow-pop"
            >
              <span className={cn('absolute inset-y-0 left-0 w-0.5', style.bar)} />
              <div className="flex items-start gap-2.5 py-2.5 pl-3.5 pr-2">
                <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', style.tone)} />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs font-semibold text-fg">{t.title}</p>
                  {t.message && <p className="mt-0.5 text-xs leading-snug text-fg-muted">{t.message}</p>}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="rounded p-1 text-fg-subtle transition-colors hover:bg-raised hover:text-fg"
                  aria-label="Dismiss notification"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
