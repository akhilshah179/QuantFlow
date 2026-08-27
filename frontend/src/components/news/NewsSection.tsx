import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Newspaper, ExternalLink } from 'lucide-react';
import { formatTime } from '../../utils/formatters';

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
}

export const NewsSection: React.FC<Props> = ({ symbol, limit = 6 }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    const endpoint = symbol ? `/news/${encodeURIComponent(symbol)}` : '/news';
    api
      .get(endpoint)
      .then((res: any) => {
        setArticles(Array.isArray(res) ? res : (res?.data || []));
        setLoading(false);
      })
      .catch(() => {
        setArticles([]);
        setLoading(false);
      });
  }, [symbol]);

  if (loading) {
    return (
      <div className="bg-white border border-[#e0e3eb] rounded-lg p-4 shadow-xs">
        <div className="text-xs text-[#707a8a] font-mono animate-pulse">Loading financial news wire feed...</div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e0e3eb] rounded-lg p-4 shadow-xs text-[#131722]">
      <h2 className="text-xs font-bold font-mono text-[#131722] mb-3 flex items-center space-x-1.5 uppercase tracking-wider border-b border-[#f0f3fa] pb-2">
        <Newspaper className="w-4 h-4 text-[#2962ff]" />
        <span>{symbol ? `${symbol.toUpperCase()} Financial Intelligence` : 'Market News & Financial Wire'}</span>
      </h2>

      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {articles.slice(0, limit).map((art) => (
            <a
              key={art.id}
              href={art.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#f8f9fd] border border-[#e0e3eb] rounded-lg p-3.5 flex flex-col justify-between hover:border-[#2962ff] transition-all group hover:bg-white shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#707a8a] mb-1.5 font-semibold">
                  <span className="text-[#2962ff] uppercase">{art.source}</span>
                  <span>{formatTime(art.publishedAt)}</span>
                </div>
                <h3 className="text-xs font-bold text-[#131722] group-hover:text-[#2962ff] line-clamp-2 transition-colors">
                  {art.title}
                </h3>
                <p className="text-[11px] text-[#707a8a] mt-1.5 line-clamp-2 leading-relaxed font-medium">
                  {art.description}
                </p>
              </div>

              <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-[#e0e3eb]/60 text-[10px]">
                {art.symbol ? (
                  <span className="bg-[#e8f0fe] text-[#2962ff] font-mono px-1.5 py-0.5 rounded font-bold">
                    ${art.symbol}
                  </span>
                ) : (
                  <span className="text-[#707a8a] font-mono font-semibold">MARKET</span>
                )}
                <span className="flex items-center space-x-1 text-[#707a8a] group-hover:text-[#2962ff] font-mono font-bold">
                  <span>Read Article</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center text-[#707a8a] font-mono text-xs border border-dashed border-[#e0e3eb] rounded-lg">
          No live news articles available for {symbol ? symbol.toUpperCase() : 'market'}.
        </div>
      )}
    </div>
  );
};
