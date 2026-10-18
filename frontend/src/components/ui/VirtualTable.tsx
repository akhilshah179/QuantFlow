import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '../../utils/cn';

export interface VirtualColumn<T> {
  key: string;
  header: React.ReactNode;
  /** CSS grid track, e.g. "minmax(90px,1fr)" or "120px". */
  width: string;
  align?: 'left' | 'right';
  className?: string;
  render: (row: T, index: number) => React.ReactNode;
}

interface VirtualTableProps<T> {
  rows: T[];
  columns: VirtualColumn<T>[];
  rowKey: (row: T, index: number) => string;
  rowHeight?: number;
  /** Max viewport height in px; the table scrolls internally beyond this. */
  maxHeight?: number;
  onRowClick?: (row: T) => void;
  minWidth?: number;
  className?: string;
}

/**
 * Grid-based table that only mounts the rows in view. Used for unbounded lists
 * (transaction logs, screener results) so live updates stay cheap.
 */
export function VirtualTable<T>({
  rows,
  columns,
  rowKey,
  rowHeight = 38,
  maxHeight = 420,
  onRowClick,
  minWidth = 720,
  className,
}: VirtualTableProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 8,
  });

  const template = columns.map((c) => c.width).join(' ');
  const bodyHeight = Math.min(maxHeight, rows.length * rowHeight);

  return (
    <div ref={scrollRef} className={cn('overflow-auto', className)} style={{ maxHeight: maxHeight + 34 }}>
      <div style={{ minWidth }}>
        <div
          className="sticky top-0 z-10 grid border-b border-line bg-surface/95 backdrop-blur-sm"
          style={{ gridTemplateColumns: template }}
        >
          {columns.map((c) => (
            <div
              key={c.key}
              className={cn(
                'whitespace-nowrap px-3 py-2 font-mono text-2xs font-semibold uppercase tracking-[0.12em] text-fg-subtle',
                c.align === 'right' && 'text-right',
              )}
            >
              {c.header}
            </div>
          ))}
        </div>
        <div className="relative" style={{ height: Math.max(bodyHeight, virtualizer.getTotalSize()) }}>
          {virtualizer.getVirtualItems().map((v) => {
            const row = rows[v.index];
            return (
              <div
                key={rowKey(row, v.index)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'group absolute inset-x-0 grid items-center border-b border-line/50 font-mono text-xs transition-colors duration-150 hover:bg-raised/70',
                  onRowClick && 'cursor-pointer',
                )}
                style={{ gridTemplateColumns: template, height: v.size, transform: `translateY(${v.start}px)` }}
              >
                {columns.map((c) => (
                  <div key={c.key} className={cn('min-w-0 truncate px-3', c.align === 'right' && 'text-right', c.className)}>
                    {c.render(row, v.index)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
