import { playwrightManager } from '../shared/playwright-manager.js';
import { cleanHtml, extractArticleContent } from '../shared/cheerio-utils.js';
import { NewsItem } from '../types.js';
import { TIMEOUTS } from '@/config/constants/timeouts.js';
import { ARTICLE_SELECTORS } from '@/config/constants/selectors.js';
import { IContentExtractor, ExtractorOptions } from '../interfaces.js';

/**
 * Google News 링크의 실제 기사 본문 추출
 * FR-001-03: 기사 본문 필수 필드 추출
 * FR-001-04: 동적 콘텐츠 지원
 *
 * @description
 * Google News RSS는 기사 링크만 제공하므로,
 * 각 링크를 Playwright로 방문하여 실제 본문을 추출합니다.
 * 다양한 뉴스 사이트의 레이아웃을 지원하기 위해 여러 CSS 셀렉터를 시도합니다.
 *
 * @implements {IContentExtractor}
 */
export class GoogleNewsExtractor implements IContentExtractor {
  private readonly REQUEST_DELAY = TIMEOUTS.REQUEST_DELAY;

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
      // 페이지 로드
      await page.goto(newsItem.url, {
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUTS.PAGE_LOAD,
      });

      // 동적 콘텐츠 대기 (이미지, 스크립트 로드 등)
      await page.waitForTimeout(TIMEOUTS.DYNAMIC_CONTENT_WAIT);

      // HTML 가져오기
      const html = await page.content();
      const cleanHTML = cleanHtml(html);

      // 본문 추출 시도 (여러 셀렉터 우선순위 순)
      const content = extractArticleContent(cleanHTML, [...ARTICLE_SELECTORS]);

      return {
        ...newsItem,
        content: content || undefined,
      };
    } catch (error) {
      console.error(`기사 본문 추출 실패 [${newsItem.url}]:`, error);
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
   * @param options - 추출 옵션 (병렬 처리 등)
   * @returns 본문이 추출된 뉴스 아이템 배열
   *
   * @description
   * 기본값은 순차 처리 (rate limiting 준수)
   * options.parallel = true 시 병렬 처리 (AsyncQueue가 동시성 제어)
   */
  async extractMultiple(newsItems: NewsItem[], options?: ExtractorOptions): Promise<NewsItem[]> {
    if (options?.parallel) {
      // 병렬 추출 (AsyncQueue가 동시성 제어)
      const extractedItems = await Promise.all(newsItems.map((item) => this.extractContent(item)));
      return extractedItems.filter((item) => item.content !== undefined);
    }

    // 순차 추출 (기본값 - rate limiting 준수)
    const results: NewsItem[] = [];

    for (const item of newsItems) {
      const extracted = await this.extractContent(item);
      if (extracted.content) {
        results.push(extracted);
      }
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
