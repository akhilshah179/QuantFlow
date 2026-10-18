import React from 'react';
import { Link } from 'react-router-dom';

/** QuantFlow mark: three candle bodies rising inside a frame. */
export const BrandMark: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <Link to="/" className="group flex items-center gap-2" aria-label="QuantFlow home">
    <span className="relative flex h-7 w-7 items-center justify-center rounded-md border border-accent/40 bg-accent/10 shadow-[0_0_18px_-6px_rgb(var(--qf-accent)/0.8)] transition-shadow group-hover:shadow-[0_0_22px_-4px_rgb(var(--qf-accent)/0.9)]">
      <svg viewBox="0 0 16 16" className="h-4 w-4 text-accent" fill="none" aria-hidden>
        <path d="M3.5 6v7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.55" />
        <rect x="2.5" y="8" width="2" height="3.5" rx="0.5" fill="currentColor" opacity="0.55" />
        <path d="M8 3.5v9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
        <rect x="7" y="5.5" width="2" height="5" rx="0.5" fill="currentColor" opacity="0.8" />
        <path d="M12.5 1.5v9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <rect x="11.5" y="3" width="2" height="5.5" rx="0.5" fill="currentColor" />
      </svg>
    </span>
    {!compact && (
      <span className="flex items-baseline gap-1.5">
        <span className="font-mono text-[13px] font-bold tracking-tight text-fg">QuantFlow</span>
        <span className="rounded border border-accent/30 px-1 py-px font-mono text-3xs font-semibold tracking-wider text-accent">PRO</span>
      </span>
    )}
  </Link>
);
