import { newsProvider, NewsArticle } from '../providers/NewsProvider';

export class NewsService {
  public async getMarketNews(): Promise<NewsArticle[]> {
    return newsProvider.getMarketNews();
  }

  public async getCompanyNews(symbol: string): Promise<NewsArticle[]> {
    return newsProvider.getCompanyNews(symbol);
  }
}

export const newsService = new NewsService();
