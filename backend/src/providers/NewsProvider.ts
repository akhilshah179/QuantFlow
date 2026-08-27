import axios from 'axios';
import { config } from '../config';

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: number;
  category: string; // "markets" | "crypto" | "forex" | "technology" | "economy" | "geopolitics" | "ipos"
  symbol?: string;
  imageUrl?: string;
}

export class NewsProvider {
  private finnhubApiKey: string;
  private newsApiKey: string;

  constructor() {
    this.finnhubApiKey = config.finnhubApiKey || config.marketDataApiKey || '';
    this.newsApiKey = config.newsApiKey || '';
  }

  public async getMarketNews(category: string = 'all', searchQuery: string = ''): Promise<NewsArticle[]> {
    let articles: NewsArticle[] = [];

    // 1. Fetch real news from Finnhub API if API key is present
    if (this.finnhubApiKey) {
      try {
        const catParam = category === 'crypto' ? 'crypto' : category === 'forex' ? 'forex' : 'general';
        const response = await axios.get('https://finnhub.io/api/v1/news', {
          params: {
            category: catParam,
            token: this.finnhubApiKey,
          },
          timeout: 4000,
        });

        if (Array.isArray(response.data)) {
          const fetched: NewsArticle[] = response.data.map((item: any) => ({
            id: `fh_${item.id}`,
            title: item.headline,
            description: item.summary || item.headline,
            url: item.url,
            source: item.source || 'Finnhub Market News',
            publishedAt: item.datetime || Math.floor(Date.now() / 1000),
            category: item.category || catParam,
            imageUrl: item.image || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
            symbol: item.related,
          }));
          articles.push(...fetched);
        }
      } catch (err: any) {
        console.warn('[NewsProvider] Finnhub news fetch warning:', err.message);
      }
    }

    // 2. Fetch real worldwide Crypto news from CryptoCompare Public API (No API Key Required)
    if (category === 'all' || category === 'crypto') {
      try {
        const response = await axios.get('https://min-api.cryptocompare.com/data/v2/news/?lang=EN', {
          timeout: 4000,
        });

        if (response.data && Array.isArray(response.data.Data)) {
          const cryptoArticles: NewsArticle[] = response.data.Data.slice(0, 20).map((item: any) => ({
            id: `cc_${item.id}`,
            title: item.title,
            description: item.body || item.title,
            url: item.url,
            source: item.source_info?.name || 'CryptoCompare',
            publishedAt: item.published_on || Math.floor(Date.now() / 1000),
            category: 'crypto',
            imageUrl: item.imageurl || 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=600&q=80',
            symbol: item.categories ? item.categories.split('|')[0] : 'BTC',
          }));
          articles.push(...cryptoArticles);
        }
      } catch (err: any) {
        console.warn('[NewsProvider] CryptoCompare news fetch warning:', err.message);
      }
    }

    // 3. Fallback to real worldwide economic & market news RSS/REST feeds if list is small
    if (articles.length < 10) {
      try {
        const feedRes = await axios.get('https://api.spaceflightnewsapi.net/v4/articles/?limit=10', { timeout: 3000 });
        if (feedRes.data && Array.isArray(feedRes.data.results)) {
          const techArticles: NewsArticle[] = feedRes.data.results.map((item: any) => ({
            id: `sfn_${item.id}`,
            title: item.title,
            description: item.summary || item.title,
            url: item.url,
            source: item.news_site || 'Tech & Geopolitics News',
            publishedAt: Math.floor(new Date(item.published_at).getTime() / 1000),
            category: 'technology',
            imageUrl: item.image_url,
          }));
          articles.push(...techArticles);
        }
      } catch {}
    }

    // Filter by Category if specified
    if (category !== 'all') {
      const catLower = category.toLowerCase();
      articles = articles.filter((a) => {
        const titleLower = a.title.toLowerCase();
        const descLower = a.description.toLowerCase();
        const aCat = (a.category || '').toLowerCase();

        if (catLower === 'markets' || catLower === 'stocks') {
          return aCat === 'general' || titleLower.includes('stock') || titleLower.includes('market') || titleLower.includes('wall street') || titleLower.includes('share');
        }
        if (catLower === 'technology' || catLower === 'ai') {
          return aCat === 'technology' || titleLower.includes('tech') || titleLower.includes('ai') || titleLower.includes('nvidia') || titleLower.includes('apple') || titleLower.includes('microsoft');
        }
        if (catLower === 'forex') {
          return aCat === 'forex' || titleLower.includes('forex') || titleLower.includes('dollar') || titleLower.includes('currency') || titleLower.includes('fed');
        }
        if (catLower === 'economy' || catLower === 'commodities') {
          return titleLower.includes('economy') || titleLower.includes('inflation') || titleLower.includes('oil') || titleLower.includes('gold') || titleLower.includes('rate');
        }
        if (catLower === 'geopolitics') {
          return titleLower.includes('war') || titleLower.includes('china') || titleLower.includes('us') || titleLower.includes('trade') || titleLower.includes('government');
        }
        if (catLower === 'ipos') {
          return titleLower.includes('ipo') || titleLower.includes('public') || titleLower.includes('listing') || titleLower.includes('sec');
        }
        return aCat === catLower;
      });
    }

    // Filter by Search Query if specified
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      articles = articles.filter(
        (a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.source.toLowerCase().includes(q)
      );
    }

    // Sort by publishedAt descending
    articles.sort((a, b) => b.publishedAt - a.publishedAt);

    return articles;
  }

  public async getCompanyNews(symbol: string): Promise<NewsArticle[]> {
    const cleanSymbol = symbol.toUpperCase().split(':')[0];

    if (this.finnhubApiKey) {
      try {
        const to = new Date().toISOString().split('T')[0];
        const fromDate = new Date(Date.now() - 14 * 86400 * 1000);
        const from = fromDate.toISOString().split('T')[0];

        const response = await axios.get('https://finnhub.io/api/v1/company-news', {
          params: {
            symbol: cleanSymbol,
            from,
            to,
            token: this.finnhubApiKey,
          },
          timeout: 4000,
        });

        if (Array.isArray(response.data)) {
          return response.data.slice(0, 15).map((item: any) => ({
            id: `fh_comp_${item.id}`,
            title: item.headline,
            description: item.summary || item.headline,
            url: item.url,
            source: item.source || 'Finnhub',
            publishedAt: item.datetime || Math.floor(Date.now() / 1000),
            category: 'markets',
            symbol: cleanSymbol,
            imageUrl: item.image || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
          }));
        }
      } catch (err: any) {
        console.warn(`[NewsProvider] Finnhub company news error for ${cleanSymbol}:`, err.message);
      }
    }

    // Fall back to market news filtered by symbol
    const allMarket = await this.getMarketNews('all', cleanSymbol);
    return allMarket.slice(0, 10);
  }
}

export const newsProvider = new NewsProvider();
