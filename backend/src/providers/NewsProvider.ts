import axios from 'axios';
import { config } from '../config';

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

export class NewsProvider {
  private newsApiKey: string;
  private finnhubApiKey: string;

  constructor() {
    this.newsApiKey = config.newsApiKey || '';
    this.finnhubApiKey = config.finnhubApiKey || config.marketDataApiKey || '';
  }

  public async getMarketNews(): Promise<NewsArticle[]> {
    if (this.newsApiKey) {
      try {
        const response = await axios.get('https://newsapi.org/v2/top-headlines', {
          params: {
            category: 'business',
            language: 'en',
            pageSize: 15,
            apiKey: this.newsApiKey,
          },
        });

        if (response.data && response.data.articles) {
          return response.data.articles.map((art: any, index: number) => ({
            id: `news_${index}_${Date.now()}`,
            title: art.title,
            description: art.description || art.title,
            url: art.url,
            source: art.source?.name || 'Financial News',
            publishedAt: Math.floor(new Date(art.publishedAt || Date.now()).getTime() / 1000),
            imageUrl: art.urlToImage,
          }));
        }
      } catch (err: any) {
        console.warn('[NewsProvider] NewsAPI error:', err.message);
      }
    }

    if (this.finnhubApiKey) {
      try {
        const response = await axios.get('https://finnhub.io/api/v1/news', {
          params: {
            category: 'general',
            token: this.finnhubApiKey,
          },
        });

        if (Array.isArray(response.data)) {
          return response.data.slice(0, 15).map((item: any) => ({
            id: `fh_news_${item.id}`,
            title: item.headline,
            description: item.summary || item.headline,
            url: item.url,
            source: item.source || 'Finnhub Market News',
            publishedAt: item.datetime || Math.floor(Date.now() / 1000),
            imageUrl: item.image,
            symbol: item.related,
          }));
        }
      } catch (err: any) {
        console.warn('[NewsProvider] Finnhub news error:', err.message);
      }
    }

    return [];
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
        });

        if (Array.isArray(response.data)) {
          return response.data.slice(0, 10).map((item: any) => ({
            id: `fh_comp_${item.id}`,
            title: item.headline,
            description: item.summary || item.headline,
            url: item.url,
            source: item.source || 'Finnhub',
            publishedAt: item.datetime || Math.floor(Date.now() / 1000),
            symbol: cleanSymbol,
            imageUrl: item.image,
          }));
        }
      } catch (err: any) {
        console.warn(`[NewsProvider] Finnhub company news error for ${cleanSymbol}:`, err.message);
      }
    }

    if (this.newsApiKey) {
      try {
        const response = await axios.get('https://newsapi.org/v2/everything', {
          params: {
            q: cleanSymbol,
            language: 'en',
            sortBy: 'publishedAt',
            pageSize: 10,
            apiKey: this.newsApiKey,
          },
        });

        if (response.data && response.data.articles) {
          return response.data.articles.map((art: any, index: number) => ({
            id: `news_comp_${index}_${Date.now()}`,
            title: art.title,
            description: art.description || art.title,
            url: art.url,
            source: art.source?.name || 'Financial News',
            publishedAt: Math.floor(new Date(art.publishedAt || Date.now()).getTime() / 1000),
            symbol: cleanSymbol,
            imageUrl: art.urlToImage,
          }));
        }
      } catch (err: any) {
        console.warn(`[NewsProvider] NewsAPI company news error for ${cleanSymbol}:`, err.message);
      }
    }

    return [];
  }
}

export const newsProvider = new NewsProvider();
