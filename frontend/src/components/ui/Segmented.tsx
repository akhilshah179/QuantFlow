import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../utils/cn';

interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  title?: string;
}

interface SegmentedProps<T extends string> {
  /** Unique per instance — drives the shared-layout sliding indicator. */
  id: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  tone?: 'accent' | 'up' | 'down';
  size?: 'xs' | 'sm';
  className?: string;
  stretch?: boolean;
}

const TONE = {
  accent: 'bg-accent/15 ring-accent/40',
  up: 'bg-up/15 ring-up/40',
  down: 'bg-down/15 ring-down/40',
};
const TONE_TEXT = { accent: 'text-accent', up: 'text-up', down: 'text-down' };

/** Segmented control whose active pill slides between options. */
export function Segmented<T extends string>({
  id,
  value,
  options,
  onChange,
  tone = 'accent',
  size = 'sm',
  className,
  stretch,
}: SegmentedProps<T>) {
  return (
    <div
      role="tablist"
      className={cn('inline-flex items-center gap-0.5 rounded-md border border-line bg-bg/60 p-0.5', stretch && 'flex w-full', className)}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            title={opt.title}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative inline-flex items-center justify-center rounded font-mono font-semibold transition-colors duration-150',
              size === 'xs' ? 'h-6 px-2 text-2xs' : 'h-7 px-2.5 text-xs',
              stretch && 'flex-1',
              active ? TONE_TEXT[tone] : 'text-fg-subtle hover:text-fg',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className={cn('absolute inset-0 rounded ring-1 ring-inset', TONE[tone])}
                transition={{ type: 'spring', stiffness: 520, damping: 40, mass: 0.6 }}
              />
            )}
            <span className="relative inline-flex items-center gap-1">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
