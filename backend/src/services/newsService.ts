import { newsProvider, NewsArticle } from '../providers/NewsProvider';

export class NewsService {
  public async getMarketNews(category?: string, search?: string): Promise<NewsArticle[]> {
    return newsProvider.getMarketNews(category, search);
  }

  public async getCompanyNews(symbol: string): Promise<NewsArticle[]> {
    return newsProvider.getCompanyNews(symbol);
  }
}

export const newsService = new NewsService();
