import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  /** Small uppercase breadcrumb above the title, e.g. "Markets / Crypto". */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ icon: Icon, eyebrow, title, subtitle, actions }) => (
  <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-raised text-accent">
        <Icon className="h-4 w-4" strokeWidth={2} />
        <span className="absolute -bottom-px left-2 right-2 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
      </div>
      <div className="min-w-0">
        {eyebrow && <div className="qf-label mb-0.5">{eyebrow}</div>}
        <h1 className="truncate text-base font-semibold tracking-tight text-fg sm:text-lg">{title}</h1>
        {subtitle && <p className="truncate text-xs text-fg-subtle">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </header>
);
