import { env } from '@/config/env.js';
import Parser from 'rss-parser';

import { isWithinRange } from '@/utils/date-time.js';
import { CollectionResult, isValidNewsItem, NewsItem } from '../types.js';

const GOOGLE_NEWS_BASE_URL = 'https://news.google.com/rss/search';
const SEARCH_KEYWORDS = ['한국경제', '금융시장', '주식시장', '환율', '부동산시장'];

export class GoogleNewsCollector {
  private parser: Parser;

  constructor() {
    this.parser = new Parser({ timeout: env.newsCollectionTimeout });
  }

  async collectNews(startTime: Date, endTime: Date): Promise<CollectionResult> {
    const allNewsItems: NewsItem[] = [];
    const errors: string[] = [];
    const urlSet = new Set<string>();

    for (const keyword of SEARCH_KEYWORDS) {
      try {
        await this.delay(1000);

        const news = await this.searchByKeyword(keyword);

        for (const item of news) {
          if (isWithinRange(item.publishedAt, startTime, endTime) && !urlSet.has(item.url)) {
            allNewsItems.push(item);
            urlSet.add(item.url);
          }
        }
      } catch (error) {
        const errorMessage = `Failed to fetch Google News for keyword "${keyword}": ${(error as Error).message}`;
        console.error(errorMessage);
        errors.push(errorMessage);
      }
    }

    return {
      success: allNewsItems.length > 0,
      newsItems: allNewsItems,
      totalCollected: allNewsItems.length,
      duplicatesRemoved: 0,
      source: 'GOOGLE_NEWS',
      timestamp: new Date(),
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private buildSearchURL(keyword: string, language: string = 'ko'): string {
    const params = new URLSearchParams({
      q: keyword,
      hl: language,
      gl: 'KR',
      ceid: 'KR:ko',
    });

    return `${GOOGLE_NEWS_BASE_URL}?${params.toString()}`;
  }

  private async searchByKeyword(keyword: string): Promise<NewsItem[]> {
    try {
      const url = this.buildSearchURL(keyword);
      const feed = await this.parser.parseURL(url);
      const newsItems: NewsItem[] = [];

      for (const item of feed.items) {
        const newsItem = this.convertGoogleNewsItem(item);
        if (newsItem && isValidNewsItem(newsItem)) {
          newsItems.push(newsItem);
        }
      }
      return newsItems;
    } catch (error) {
      console.error(`Failed to fetch Google News for keyword "${keyword}": ${(error as Error).message}`);
      return [];
    }
  }

  private convertGoogleNewsItem(item: Parser.Item): NewsItem | null {
    try {
      const title = item.title || '';
      const sourceName = this.extractSourceName(title) || 'Google News';

      return {
        title: title,
        summary: item.contentSnippet || '',
        url: item.link || '',
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        source: sourceName,
        category: '경제',
      };
    } catch (error) {
      console.error('Error converting Google News item:', error);
      return null;
    }
  }

  private extractSourceName(title: string): string | null {
    const match = title.match(/ - (.+)$/);
    return match ? match[1].trim() : null;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
