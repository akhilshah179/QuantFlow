import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

interface PanelProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title?: React.ReactNode;
  icon?: LucideIcon;
  /** Tint for the header icon — semantic only (up/down/accent). */
  iconTone?: 'accent' | 'up' | 'down' | 'muted';
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  bodyClassName?: string;
  as?: 'section' | 'div' | 'aside';
}

const ICON_TONE = {
  accent: 'text-accent',
  up: 'text-up',
  down: 'text-down',
  muted: 'text-fg-subtle',
};

export const Panel: React.FC<PanelProps> = ({
  title,
  icon: Icon,
  iconTone = 'accent',
  meta,
  actions,
  className,
  bodyClassName,
  children,
  as: Tag = 'section',
  ...rest
}) => (
  <Tag className={cn('qf-panel flex flex-col', className)} {...rest}>
    {(title || actions || meta) && (
      <header className="qf-panel-header">
        <div className="flex min-w-0 items-center gap-2">
          {Icon && <Icon className={cn('h-3.5 w-3.5 shrink-0', ICON_TONE[iconTone])} strokeWidth={2} />}
          {title && (
            <h2 className="truncate font-mono text-2xs font-semibold uppercase tracking-[0.14em] text-fg">{title}</h2>
          )}
          {meta && <div className="hidden shrink-0 sm:block">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
      </header>
    )}
    <div className={cn('min-h-0 flex-1', bodyClassName ?? 'p-3.5')}>{children}</div>
  </Tag>
);
