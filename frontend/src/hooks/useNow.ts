import { useEffect, useState } from 'react';

/** Current time, refreshed on an interval aligned to the wall-clock second. */
export function useNow(intervalMs: number = 1000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    const align = setTimeout(() => {
      setNow(new Date());
      timer = setInterval(() => setNow(new Date()), intervalMs);
    }, intervalMs - (Date.now() % intervalMs));
    return () => {
      clearTimeout(align);
      clearInterval(timer);
    };
  }, [intervalMs]);

  return now;
}
