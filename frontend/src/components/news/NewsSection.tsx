import React from 'react';
import { motion } from 'motion/react';
import { Newspaper, ArrowUpRight } from 'lucide-react';
import { formatTime } from '../../utils/formatters';
import { useNews } from '../../services/queries';
import { Panel } from '../ui/Panel';
import { EmptyState, Skeleton } from '../ui/misc';
import { cn } from '../../utils/cn';

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: number;
  symbol?: string;
  imageUrl?: string;
}

interface Props {
  symbol?: string;
  limit?: number;
  /** `list` is a compact single-column wire for side panels. */
  variant?: 'grid' | 'list';
  className?: string;
}

export const NewsSection: React.FC<Props> = ({ symbol, limit = 6, variant = 'grid', className }) => {
  const { data: articles = [], isLoading } = useNews(symbol);
  const isList = variant === 'list';

  return (
    <Panel
      title={symbol ? `${symbol.toUpperCase()} · Intelligence` : 'Market Wire'}
      icon={Newspaper}
      className={className}
      meta={<span className="font-mono text-3xs text-fg-subtle">{articles.length} stories</span>}
      bodyClassName={isList ? 'p-0' : 'p-3.5'}
    >
      {isLoading ? (
        <div className={cn(isList ? 'space-y-px p-3' : 'grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3')}>
          {Array.from({ length: isList ? 5 : 3 }).map((_, i) => (
            <Skeleton key={i} className={isList ? 'my-2 h-10' : 'h-32'} />
          ))}
        </div>
      ) : articles.length > 0 ? (
        <div className={cn(isList ? 'divide-y divide-line/60' : 'grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3')}>
          {articles.slice(0, limit).map((art, i) =>
            isList ? (
              <motion.a
                key={art.id}
                href={art.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.03, duration: 0.2 }}
                className="group flex gap-3 px-3.5 py-2.5 transition-colors hover:bg-raised/70"
              >
                <span className="num mt-0.5 w-10 shrink-0 text-2xs text-fg-subtle">{formatTime(art.publishedAt)}</span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-xs font-medium leading-snug text-fg transition-colors group-hover:text-accent">{art.title}</span>
                  <span className="mt-0.5 flex items-center gap-2 font-mono text-3xs uppercase tracking-wider text-fg-subtle">
                    <span>{art.source}</span>
                    {art.symbol && <span className="text-accent">${art.symbol}</span>}
                  </span>
                </span>
                <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fg-subtle opacity-0 transition-[opacity,transform] duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
              </motion.a>
            ) : (
              <motion.a
                key={art.id}
                href={art.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.22 }}
                className="group flex flex-col justify-between rounded-md border border-line bg-bg/40 p-3.5 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:bg-raised/60"
              >
                <div>
                  <div className="mb-1.5 flex items-center justify-between font-mono text-3xs font-semibold uppercase tracking-wider text-fg-subtle">
                    <span className="text-accent">{art.source}</span>
                    <span className="num">{formatTime(art.publishedAt)}</span>
                  </div>
                  <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-fg">{art.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-fg-subtle">{art.description}</p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-2 font-mono text-3xs uppercase tracking-wider">
                  {art.symbol ? (
                    <span className="rounded bg-accent/10 px-1.5 py-0.5 font-bold text-accent">${art.symbol}</span>
                  ) : (
                    <span className="text-fg-subtle">Market</span>
                  )}
                  <span className="flex items-center gap-1 text-fg-subtle transition-colors group-hover:text-fg">
                    Read
                    <ArrowUpRight className="h-3 w-3 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </motion.a>
            ),
          )}
        </div>
      ) : (
        <EmptyState
          icon={Newspaper}
          title={`No live news articles available for ${symbol ? symbol.toUpperCase() : 'market'}.`}
          className={isList ? 'm-3.5' : undefined}
        />
      )}
    </Panel>
  );
};
