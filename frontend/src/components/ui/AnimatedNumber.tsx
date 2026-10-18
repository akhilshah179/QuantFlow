import React, { memo, useEffect, useLayoutEffect, useRef } from 'react';
import { animate } from 'motion/react';
import { useReducedMotionPref } from '../../hooks/useReducedMotionPref';
import { cn } from '../../utils/cn';

interface AnimatedNumberProps {
  value: number;
  format: (value: number) => string;
  /** Seconds. Kept short so values never feel laggy. */
  duration?: number;
  /** Briefly tint green/red in the direction of change. */
  tintOnChange?: boolean;
  /** Count up from this value on mount (e.g. 0 for hero figures). */
  initialFrom?: number;
  className?: string;
}

/**
 * Tweens between values by writing textContent from a Motion animation — no
 * React state per frame, so a P&L roll costs one span's paint.
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = memo(
  ({ value, format, duration = 0.55, tintOnChange, initialFrom, className }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const displayed = useRef<number>(initialFrom ?? value);
    const formatRef = useRef(format);
    formatRef.current = format;
    const reduceMotion = useReducedMotionPref();

    useLayoutEffect(() => {
      if (ref.current) ref.current.textContent = formatRef.current(displayed.current);
    }, []);

    useEffect(() => {
      const el = ref.current;
      if (!el || !isFinite(value)) return;
      const from = displayed.current;
      if (from === value) {
        el.textContent = formatRef.current(value);
        return;
      }

      let tintTimer: ReturnType<typeof setTimeout> | undefined;
      if (tintOnChange) {
        el.classList.remove('is-tick-up', 'is-tick-down');
        el.classList.add(value > from ? 'is-tick-up' : 'is-tick-down');
        tintTimer = setTimeout(() => el.classList.remove('is-tick-up', 'is-tick-down'), 700);
      }

      if (reduceMotion || !isFinite(from)) {
        displayed.current = value;
        el.textContent = formatRef.current(value);
        return () => {
          clearTimeout(tintTimer);
          el.classList.remove('is-tick-up', 'is-tick-down');
        };
      }

      const controls = animate(from, value, {
        duration,
        ease: [0.2, 0.8, 0.2, 1],
        onUpdate: (v) => {
          displayed.current = v;
          el.textContent = formatRef.current(v);
        },
      });
      return () => {
        controls.stop();
        clearTimeout(tintTimer);
        el.classList.remove('is-tick-up', 'is-tick-down');
      };
    }, [value, duration, reduceMotion, tintOnChange]);

    return <span ref={ref} className={cn('qf-live num', className)} />;
  },
);
AnimatedNumber.displayName = 'AnimatedNumber';
