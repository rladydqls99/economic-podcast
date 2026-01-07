import Parser from 'rss-parser';

import { isWithinRange } from '@/utils/date-time.js';
import { CollectionResult, isValidNewsItem, NewsItem } from '../types.js';
import { ALL_KEYWORDS } from '@/config/keywords.js';

const GOOGLE_NEWS_BASE_URL = 'https://news.google.com/rss/search';

/**
 * Google News RSS 메타데이터 수집기
 *
 * @description
 * Google News RSS 피드에서 뉴스 메타데이터만 수집합니다.
 * 본문 추출은 별도의 Extractor 레이어가 담당합니다.
 *
 * **책임**:
 * - RSS 피드 파싱
 * - 메타데이터 추출 (title, url, publishedAt, source 등)
 * - 날짜 범위 필터링
 * - 중복 URL 제거
 */
export class GoogleNewsCollector {
  private parser: Parser;

  constructor() {
    this.parser = new Parser({ timeout: 30000 });
  }

  /**
   * Google News RSS에서 메타데이터 수집
   *
   * @param startTime - 수집 시작 시간
   * @param endTime - 수집 종료 시간
   * @returns 메타데이터만 포함된 뉴스 아이템 배열
   *
   * @description
   * - 여러 키워드로 RSS 피드 검색
   * - 날짜 범위 필터링
   * - URL 기반 중복 제거
   * - 본문(content)은 포함되지 않음 (Extractor가 별도 처리)
   */
  async collectMetadata(startTime: Date, endTime: Date): Promise<CollectionResult> {
    const allNewsItems: NewsItem[] = [];
    const errors: string[] = [];
    const urlSet = new Set<string>();
    let duplicatesRemoved = 0;

    for (const keyword of ALL_KEYWORDS) {
      try {
        await this.delay(1000);

        const news = await this.searchByKeyword(keyword);

        for (const item of news) {
          if (isWithinRange(item.publishedAt, startTime, endTime)) {
            if (!urlSet.has(item.url)) {
              allNewsItems.push(item);
              urlSet.add(item.url);
            } else {
              duplicatesRemoved++;
            }
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
      duplicatesRemoved,
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
