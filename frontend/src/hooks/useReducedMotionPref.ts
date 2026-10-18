import { useReducedMotion } from 'motion/react';

/** True when the user asked the OS to minimise motion — gate continuous loops on this. */
export function useReducedMotionPref(): boolean {
  return useReducedMotion() ?? false;
}
