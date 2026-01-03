import { playwrightManager } from '../shared/playwright-manager.js';
import { cleanHtml, extractArticleContent } from '../shared/cheerio-utils.js';
import { NewsItem } from '../types.js';

/**
 * Google News 링크의 실제 기사 본문 추출
 * FR-001-03: 기사 본문 필수 필드 추출
 * FR-001-04: 동적 콘텐츠 지원
 *
 * @description
 * Google News RSS는 기사 링크만 제공하므로,
 * 각 링크를 Playwright로 방문하여 실제 본문을 추출합니다.
 * 다양한 뉴스 사이트의 레이아웃을 지원하기 위해 여러 CSS 셀렉터를 시도합니다.
 */
export class GoogleNewsExtractor {
  private readonly REQUEST_DELAY = 1000; // 1초 딜레이 (rate limiting)

  /**
   * 단일 기사 URL에서 본문 추출
   *
   * @param newsItem - 본문을 추출할 뉴스 아이템
   * @returns 본문이 추가된 뉴스 아이템
   *
   * @example
   * const extractor = new GoogleNewsExtractor();
   * const enriched = await extractor.extractContent(newsItem);
   * console.log(enriched.content); // 추출된 본문
   */
  async extractContent(newsItem: NewsItem): Promise<NewsItem> {
    const page = await playwrightManager.newPage();

    try {
      // 페이지 로드 (30초 타임아웃)
      await page.goto(newsItem.url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // 동적 콘텐츠 대기 (이미지, 스크립트 로드 등)
      await page.waitForTimeout(2000);

      // HTML 가져오기
      const html = await page.content();
      const cleanHTML = cleanHtml(html);

      // 본문 추출 시도 (여러 셀렉터 우선순위 순)
      const content = extractArticleContent(cleanHTML, [
        'article',
        '.article-content',
        '.news-content',
        '#articleBody',
        'main',
        '.post-content',
        '.entry-content',
        '[itemprop="articleBody"]',
      ]);

      return {
        ...newsItem,
        content: content || newsItem.summary,
      };
    } catch (error) {
      console.error(`기사 본문 추출 실패 [${newsItem.url}]:`, error);
      // 실패 시 원본 반환 (summary 유지)
      return newsItem;
    } finally {
      await page.close();
      await this.delay(this.REQUEST_DELAY);
    }
  }

  /**
   * 여러 기사 일괄 처리
   *
   * @param newsItems - 본문을 추출할 뉴스 아이템 배열
   * @returns 본문이 추가된 뉴스 아이템 배열
   *
   * @description
   * 순차적으로 처리하여 rate limiting 준수
   * 각 요청 사이에 REQUEST_DELAY만큼 대기
   */
  async extractMultiple(newsItems: NewsItem[]): Promise<NewsItem[]> {
    const results: NewsItem[] = [];

    for (const item of newsItems) {
      const extracted = await this.extractContent(item);
      results.push(extracted);
    }

    return results;
  }

  /**
   * 지연 유틸리티 (rate limiting용)
   *
   * @param ms - 대기 시간 (밀리초)
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
