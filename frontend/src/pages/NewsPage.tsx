import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Newspaper, Search, ExternalLink, RefreshCw, Clock, Tag, Globe, TrendingUp } from 'lucide-react';

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: number;
  category: string;
  symbol?: string;
  imageUrl?: string;
}

export const NewsPage: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const categories = [
    { id: 'all', label: 'All News' },
    { id: 'markets', label: 'Markets & Stocks' },
    { id: 'technology', label: 'Technology & AI' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'forex', label: 'Forex' },
    { id: 'economy', label: 'Economy & Rates' },
    { id: 'geopolitics', label: 'Geopolitics' },
    { id: 'ipos', label: 'IPOs & Listings' },
  ];

  const fetchNews = (cat: string = category, q: string = searchQuery) => {
    setLoading(true);
    api.get(`/news?category=${cat}&search=${encodeURIComponent(q)}`)
      .then((res: any) => {
        const data = Array.isArray(res) ? res : (res?.data || []);
        setArticles(data);
        setLoading(false);
      })
      .catch(() => {
        setArticles([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchNews(category, searchQuery);
  }, [category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNews(category, searchQuery);
  };

  const getRelativeTime = (timestampSec: number) => {
    const diffMs = Date.now() - timestampSec * 1000;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  return (
    <div className="space-y-4 text-[#131722]">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white border border-[#e0e3eb] rounded-lg p-4 shadow-xs gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-[#e8f0fe] text-[#2962ff] flex items-center justify-center font-bold">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-mono text-[#131722] flex items-center space-x-2">
              <span>Worldwide Financial News Terminal</span>
            </h1>
            <p className="text-xs font-mono text-[#707a8a] font-medium">Real-time global market intelligence, geopolitical events, crypto & macroeconomic coverage</p>
          </div>
        </div>

        {/* Live Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 w-full md:w-80 font-mono text-xs">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#707a8a] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news by topic, company..."
              className="w-full bg-[#f8f9fd] border border-[#e0e3eb] rounded-lg pl-9 pr-3 py-2 text-[#131722] placeholder-[#9598a1] focus:outline-none focus:border-[#2962ff] font-semibold"
            />
          </div>
          <button
            type="submit"
            className="bg-[#2962ff] hover:bg-[#1e54e4] text-white px-3 py-2 rounded-lg font-bold transition-all shadow-xs cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 font-mono text-xs border-b border-[#e0e3eb]">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-3 py-1.5 rounded-t-lg font-bold whitespace-nowrap transition-all border-b-2 ${
              category === cat.id
                ? 'bg-white border-[#2962ff] text-[#2962ff] shadow-xs'
                : 'bg-[#f8f9fd] border-transparent text-[#707a8a] hover:bg-[#e0e3eb] hover:text-[#131722]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Articles Grid */}
      {loading ? (
        <div className="h-64 flex items-center justify-center font-mono text-xs text-[#707a8a] bg-white border border-[#e0e3eb] rounded-lg">
          <RefreshCw className="w-5 h-5 animate-spin mr-2 text-[#2962ff]" />
          Fetching Real Financial News...
        </div>
      ) : articles.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center font-mono text-xs text-[#707a8a] bg-white border border-[#e0e3eb] rounded-lg p-6 text-center space-y-2">
          <Globe className="w-8 h-8 text-[#9598a1]" />
          <div className="font-bold text-[#131722]">No articles found</div>
          <div>Try adjusting your category filter or search query.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-[#e0e3eb] hover:border-[#2962ff] rounded-lg overflow-hidden flex flex-col justify-between p-4 shadow-xs transition-all hover:shadow-md group"
            >
              <div className="space-y-3">
                {item.imageUrl && (
                  <div className="h-40 w-full overflow-hidden rounded bg-[#f0f3fa]">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e: any) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] font-mono text-[#707a8a]">
                  <span className="bg-[#e8f0fe] text-[#2962ff] px-2 py-0.5 rounded font-bold uppercase text-[10px]">
                    {item.source}
                  </span>
                  <span className="flex items-center font-medium">
                    <Clock className="w-3 h-3 mr-1" />
                    {getRelativeTime(item.publishedAt)}
                  </span>
                </div>

                <h3 className="font-mono text-sm font-bold text-[#131722] group-hover:text-[#2962ff] transition-colors line-clamp-2 leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-[#707a8a] font-medium line-clamp-3 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-[#f0f3fa] flex items-center justify-between font-mono text-[11px] text-[#2962ff] font-bold">
                <span className="flex items-center text-[#707a8a]">
                  <Tag className="w-3 h-3 mr-1 text-[#2962ff]" />
                  {item.category.toUpperCase()}
                </span>
                <span className="flex items-center group-hover:translate-x-1 transition-transform">
                  Read Full Article <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
