import React from 'react';
import { cn } from '../../utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'buy' | 'sell' | 'danger';
type Size = 'xs' | 'sm' | 'md';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-fg hover:brightness-110 shadow-[0_0_0_1px_rgb(var(--qf-accent)/0.4),0_6px_20px_-8px_rgb(var(--qf-accent)/0.6)]',
  secondary: 'bg-raised text-fg border border-line hover:border-line-strong hover:bg-overlay',
  ghost: 'text-fg-muted hover:text-fg hover:bg-raised',
  buy: 'bg-up text-[#04140c] hover:brightness-110 shadow-[0_6px_20px_-8px_rgb(var(--qf-up)/0.7)]',
  sell: 'bg-down text-white hover:brightness-110 shadow-[0_6px_20px_-8px_rgb(var(--qf-down)/0.7)]',
  danger: 'text-fg-muted hover:text-down hover:bg-down/10',
};

const SIZES: Record<Size, string> = {
  xs: 'h-6 px-2 text-2xs gap-1',
  sm: 'h-7 px-2.5 text-xs gap-1.5',
  md: 'h-9 px-4 text-xs gap-2',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'sm', loading, className, children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'relative inline-flex select-none items-center justify-center whitespace-nowrap rounded-md font-mono font-semibold',
        'transition-[transform,filter,background-color,border-color,color,box-shadow] duration-150 ease-terminal',
        'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </span>
      )}
      <span className={cn('inline-flex items-center gap-[inherit]', loading && 'invisible')}>{children}</span>
    </button>
  ),
);
Button.displayName = 'Button';
