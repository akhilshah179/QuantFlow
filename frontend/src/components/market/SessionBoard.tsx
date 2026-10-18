import React from 'react';
import { Clock } from 'lucide-react';
import { useNow } from '../../hooks/useNow';
import { localTime, minutesToBoundary, PHASE_LABEL, sessionPhase, SESSIONS } from '../../utils/marketHours';
import { Panel } from '../ui/Panel';
import { LiveDot } from '../ui/misc';
import { cn } from '../../utils/cn';

const fmtCountdown = (mins: number) => (mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`);

/** Global session board — regular hours per venue, ticking once a second. */
export const SessionBoard: React.FC<{ className?: string }> = ({ className }) => {
  const now = useNow(1000);

  return (
    <Panel title="Market Sessions" icon={Clock} className={className} bodyClassName="p-0">
      <div className="divide-y divide-line/60">
        {SESSIONS.map((s) => {
          const phase = sessionPhase(s, now);
          const boundary = minutesToBoundary(s, now);
          const tone = phase === 'OPEN' ? 'up' : phase === 'CLOSED' ? 'muted' : 'accent';
          return (
            <div key={s.id} className="flex items-center justify-between px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <LiveDot tone={tone} pulse={phase === 'OPEN'} />
                <div>
                  <div className="font-mono text-xs font-semibold text-fg">{s.label}</div>
                  <div className="text-3xs text-fg-subtle">{s.city}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="num text-xs text-fg">{localTime(s, now, true)}</div>
                <div
                  className={cn(
                    'font-mono text-3xs uppercase tracking-wider',
                    phase === 'OPEN' ? 'text-up' : phase === 'CLOSED' ? 'text-fg-subtle' : 'text-accent',
                  )}
                >
                  {PHASE_LABEL[phase]}
                  {boundary && ` · ${boundary.label} ${fmtCountdown(boundary.minutes)}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};
