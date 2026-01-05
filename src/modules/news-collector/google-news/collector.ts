import Parser from 'rss-parser';

import { isWithinRange } from '@/utils/date-time.js';
import { CollectionResult, isValidNewsItem, NewsItem } from '../types.js';
import { chatJSON } from '@/utils/gemini.js';
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

    // AI 필터링: 쇼츠용 매력적인 뉴스 5개 선별
    const filteredNewsItems = await this.filterNewsForShorts(allNewsItems);

    return {
      success: filteredNewsItems.length > 0,
      newsItems: filteredNewsItems,
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

  /**
   * AI를 활용하여 쇼츠용 뉴스 1차 필터링 (제목 기반)
   *
   * @param newsItems - 필터링할 뉴스 아이템 배열
   * @returns 크롤링할 가치가 있는 뉴스 15개
   *
   * @description
   * - 제목만으로 1차 스크리닝 (100개 → 15개)
   * - 명백히 쇼츠 부적합한 뉴스 제외
   * - 본문 확인이 필요한 후보군 선별
   * - 여유있게 15개 선정 (최종 3개를 위한 안전 마진)
   */
  private async filterNewsForShorts(newsItems: NewsItem[]): Promise<NewsItem[]> {
    if (newsItems.length === 0) {
      return [];
    }

    try {
      const newsWithId = newsItems.map((item, index) => ({
        id: index,
        title: item.title,
      }));

      const filtered = await chatJSON<{ id: number; title: string }[]>(this.buildFilteringPrompt(newsWithId));

      // AI가 선별한 ID에 해당하는 뉴스만 추출
      const selectedIds = new Set(filtered.map((item) => item.id));
      return newsItems.filter((_, index) => selectedIds.has(index));
    } catch (error) {
      console.error('뉴스 필터링 중 오류 발생:', error);
      // 필터링 실패 시 원본 반환 (또는 상위 5개만 반환)
      return newsItems.slice(0, 5);
    }
  }

  /**
   * 쇼츠용 뉴스 1차 필터링 프롬프트 생성 (제목 기반)
   */
  private buildFilteringPrompt(news: { id: number; title: string }[]): string {
    return `
당신은 한국 경제 유튜브 쇼츠 전문 에디터입니다.

## 목표
아래 뉴스 목록에서 **본문을 확인해볼 가치가 있는** 후보 15개를 선별하세요.
(제목만으로 명백히 쇼츠 부적합한 뉴스만 제외)

## 선별 기준 (우선순위 순)

### 1. 내 지갑에 직접 영향
- 환율, 금리, 물가, 부동산, 주식, 연금, 세금
- 대출, 예금 금리 변동
- 기름값, 전기요금 등 생활비

### 2. 한국 관련성
- 한국 기업(삼성, 현대, SK 등) 언급
- 한미/한중/한일 경제 관계
- K-콘텐츠, 반도체, 배터리 산업

### 3. 자극적 요소
- 급등, 폭락, 역대급, 최초, 위기 등 강한 표현
- 유명 인물/기업의 예상 밖 행보
- "~하면 망한다", "~안 하면 손해" 류의 긴박함

### 4. 트렌드 키워드
- AI, 비트코인, 엔비디아, 테슬라
- 부의 이동, MZ세대 재테크

## 제외 대상
- 한국과 무관한 특정 국가 내수 뉴스
- 전문 용어만 나열된 딱딱한 제목
- 이미 식상해진 반복 주제

## 입력 데이터
${JSON.stringify(news)}

## 출력 형식
반드시 아래 JSON 배열 형식으로만 응답하세요. 다른 설명 없이 JSON만 반환합니다.
[
  {"id": 숫자, "title": "제목"}
]
`;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
