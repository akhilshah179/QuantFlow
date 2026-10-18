import React from 'react';
import { LucideIcon, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '../../utils/cn';
import { formatSignedPercent } from '../../utils/formatters';

/* Pulsing status dot ------------------------------------------------------- */

const DOT_TONE = {
  up: 'bg-up',
  down: 'bg-down',
  accent: 'bg-accent',
  muted: 'bg-fg-subtle',
  info: 'bg-info',
};

export const LiveDot: React.FC<{ tone?: keyof typeof DOT_TONE; pulse?: boolean; className?: string }> = ({
  tone = 'up',
  pulse = true,
  className,
}) => (
  <span className={cn('relative inline-flex h-1.5 w-1.5 shrink-0', className)}>
    {pulse && <span className={cn('absolute inset-0 rounded-full animate-live-ping', DOT_TONE[tone])} />}
    <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', DOT_TONE[tone])} />
  </span>
);

/* Static change pill (snapshot data) --------------------------------------- */

export const ChangePill: React.FC<{ value: number; showIcon?: boolean; className?: string }> = ({
  value,
  showIcon = false,
  className,
}) => {
  const up = value > 0;
  const down = value < 0;
  const Icon = down ? TrendingDown : TrendingUp;
  return (
    <span
      className={cn(
        'num inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        up && 'bg-up/10 text-up ring-up/20',
        down && 'bg-down/10 text-down ring-down/20',
        !up && !down && 'bg-raised text-fg-muted ring-line',
        className,
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {formatSignedPercent(value)}
    </span>
  );
};

/* Skeleton shimmer ---------------------------------------------------------- */

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('relative overflow-hidden rounded bg-raised', className)}>
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
  </div>
);

export const SkeletonRows: React.FC<{ rows?: number; className?: string }> = ({ rows = 5, className }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-8 w-full" />
    ))}
  </div>
);

/* Empty / error states ------------------------------------------------------ */

export const EmptyState: React.FC<{
  icon?: LucideIcon;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  tone?: 'muted' | 'down';
  className?: string;
}> = ({ icon: Icon, title, hint, action, tone = 'muted', className }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-line px-6 py-10 text-center',
      className,
    )}
  >
    {Icon && (
      <div
        className={cn(
          'mb-1 flex h-9 w-9 items-center justify-center rounded-md border',
          tone === 'down' ? 'border-down/30 bg-down/10 text-down' : 'border-line bg-raised text-fg-subtle',
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
    )}
    <p className={cn('font-mono text-xs font-semibold', tone === 'down' ? 'text-down' : 'text-fg-muted')}>{title}</p>
    {hint && <p className="max-w-sm text-xs text-fg-subtle">{hint}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

/* Field label --------------------------------------------------------------- */

export const FieldLabel: React.FC<{ children: React.ReactNode; aside?: React.ReactNode; htmlFor?: string }> = ({
  children,
  aside,
  htmlFor,
}) => (
  <label htmlFor={htmlFor} className="mb-1.5 flex items-center justify-between">
    <span className="qf-label">{children}</span>
    {aside && <span className="font-mono text-2xs text-fg-subtle">{aside}</span>}
  </label>
);

/* Sign helper ---------------------------------------------------------------- */

export const signTone = (v: number) => (v > 0 ? 'text-up' : v < 0 ? 'text-down' : 'text-fg-muted');
