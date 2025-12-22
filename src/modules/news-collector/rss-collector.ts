import { env } from '@/config/env.js';
import Parser from 'rss-parser';
import { CollectionResult, isValidNewsItem, NewsItem } from './types.js';
import { isWithinRange } from '@/utils/date-time.js';

const RSS_FEEDS = [
  { name: '조선일보', url: 'https://www.chosun.com/arc/outboundfeeds/rss/category/economy/?outputType=xml' },
];

export class RSSCollector {
  private parser: Parser;

  constructor() {
    this.parser = new Parser({
      timeout: env.newsCollectionTimeout, // 30 seconds timeout
    });
  }

  async collectNews(startTime: Date, endTime: Date): Promise<CollectionResult> {
    const allNewsItems: NewsItem[] = [];
    const errors: string[] = [];

    for (const feed of RSS_FEEDS) {
      try {
        const news = await this.fetchRSSFeed(feed.url, feed.name);
        const filteredNews = news.filter((item) => isWithinRange(item.publishedAt, startTime, endTime));

        allNewsItems.push(...filteredNews);
      } catch (error) {
        const errorMessage = `Failed to fetch RSS news from ${feed.name}: ${(error as Error).message}`;
        console.error(errorMessage);
        errors.push(errorMessage);
      }
    }

    return {
      success: allNewsItems.length > 0,
      newsItems: allNewsItems,
      totalCollected: allNewsItems.length,
      duplicatesRemoved: 0,
      source: 'RSS_FEEDS',
      timestamp: new Date(),
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private async fetchRSSFeed(feedUrl: string, sourceName: string): Promise<NewsItem[]> {
    try {
      const feed = await this.parser.parseURL(feedUrl);
      const newsItems: NewsItem[] = [];

      for (const item of feed.items) {
        const newsItem = this.convertRSSItemToNewsItem(item, sourceName);
        if (newsItem && isValidNewsItem(newsItem)) {
          newsItems.push(newsItem);
        }
      }

      return newsItems;
    } catch (error) {
      console.error(`Error fetching RSS feed from ${feedUrl}:`, error);
      return [];
    }
  }

  private convertRSSItemToNewsItem(item: Parser.Item, sourceName: string): NewsItem | null {
    try {
      return {
        title: item.title || '',
        summary: item.contentSnippet || item.content || item.summary || '',
        url: item.link || '',
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        source: sourceName,
        category: item.categories?.[0] || undefined,
      };
    } catch (error) {
      console.error('Error converting RSS item to NewsItem:', error);
      return null;
    }
  }
}
