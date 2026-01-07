import { chatJSON } from '@/utils/gemini.js';
import { CollectionResult, NewsItem } from '../types.js';
import { GoogleNewsCollector } from './collector.js';
import { GoogleNewsExtractor } from './extractor.js';
import { extractMeaningfulContent } from '../shared/cheerio-utils.js';
import { 콘텐츠_기반_필터링_프롬프트, 타이틀_기반_필터링_프롬프트 } from '../shared/generate-prompt.js';

/**
 * Google News 수집 서비스
 *
 * @description
 * Collector와 Extractor를 조율하여 전체 뉴스 수집 파이프라인 관리
 *
 * **파이프라인**:
 * 1. Collector: RSS에서 메타데이터 수집 (title, url, publishedAt 등)
 * 2. Filter: AI를 활용한 뉴스 필터링
 * 3. Extractor: 각 URL 방문하여 본문 추출
 * 4. Filter: AI를 활용한 뉴스 필터링
 * 5. 결과 통합 및 CollectionResult 생성
 *
 * **책임 분리**:
 * - Service: 전체 프로세스 조율, 비즈니스 로직
 * - Collector: RSS 파싱, 메타데이터 수집
 * - Extractor: 웹 스크래핑, 본문 추출
 */
export class GoogleNewsService {
  private collector: GoogleNewsCollector;
  private extractor: GoogleNewsExtractor;

  constructor() {
    this.collector = new GoogleNewsCollector();
    this.extractor = new GoogleNewsExtractor();
  }

  /**
   * 뉴스 수집 전체 파이프라인 실행
   *
   * @param startTime - 수집 시작 시간
   * @param endTime - 수집 종료 시간
   * @returns 수집 결과
   *
   * @example
   * const service = new GoogleNewsService();
   * const result = await service.collectNews(
   *   new Date('2024-01-01T00:00:00'),
   *   new Date('2024-01-01T22:00:00')
   * );
   * console.log(`${result.totalCollected}개 수집 완료`);
   */
  async collectNews(startTime: Date, endTime: Date): Promise<CollectionResult> {
    const startTimestamp = Date.now();
    const errors: string[] = [];

    try {
      console.log(`[GoogleNewsService] Step 1: 메타데이터 수집 시작`);
      const metadataResult = await this.collector.collectMetadata(startTime, endTime);

      if (!metadataResult.success) {
        errors.push(...(metadataResult.errors || []));
      }

      const newsItems = metadataResult.newsItems;
      console.log(`[GoogleNewsService] 메타데이터 수집 완료: ${newsItems.length}개`);

      console.log(`[GoogleNewsService] Step 2: 메타데이터 필터링 시작`);
      const filteredNewsItems = await this.filterNewsByTitle(newsItems);
      console.log(`[GoogleNewsService] 메타데이터 필터링 완료: ${filteredNewsItems.length}개`);

      console.log(`[GoogleNewsService] Step 3: 본문 추출 시작`);
      const newsWithContent = await this.extractor.extractMultiple(filteredNewsItems);
      console.log(`[GoogleNewsService] 본문 추출 완료: ${newsWithContent.length}개`);

      console.log(`[GoogleNewsService] Step 4: 최종 필터링 시작`);
      const finalFilteredNewsItems = await this.filterNewsByContent(newsWithContent);
      console.log(`[GoogleNewsService] 최종 필터링 완료: ${finalFilteredNewsItems.length}개`);

      // Step 4: 결과 생성 =====================================================
      const endTimestamp = Date.now();
      const duration = ((endTimestamp - startTimestamp) / 1000).toFixed(2);
      console.log(`[GoogleNewsService] 전체 처리 완료 (소요시간: ${duration}초)`);

      return {
        success: finalFilteredNewsItems.length > 0,
        newsItems: finalFilteredNewsItems,
        totalCollected: finalFilteredNewsItems.length,
        duplicatesRemoved: metadataResult.duplicatesRemoved,
        source: 'GOOGLE_NEWS',
        timestamp: new Date(),
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      const errorMessage = `Google News 수집 실패: ${(error as Error).message}`;
      console.error(`[GoogleNewsService] ${errorMessage}`);
      errors.push(errorMessage);

      return {
        success: false,
        newsItems: [],
        totalCollected: 0,
        duplicatesRemoved: 0,
        source: 'GOOGLE_NEWS',
        timestamp: new Date(),
        errors,
      };
    }
  }

  async filterNewsByTitle(newsItems: NewsItem[]): Promise<NewsItem[]> {
    if (newsItems.length === 0) return [];

    try {
      const newsWithId = newsItems.map((item, index) => ({
        id: index,
        title: item.title,
      }));

      const prompt = 타이틀_기반_필터링_프롬프트(newsWithId);
      const filtered = await chatJSON<{ id: number; title: string }[]>(prompt);

      return filtered.map((item) => newsItems[item.id]);
    } catch (error) {
      console.error('뉴스 필터링 중 오류 발생:', error);
      return newsItems.slice(0, 5);
    }
  }

  async filterNewsByContent(newsItems: NewsItem[]): Promise<NewsItem[]> {
    if (newsItems.length === 0) {
      return [];
    }

    try {
      const newsWithId = newsItems.map((item, index) => ({
        id: index,
        title: item.title,
        content: extractMeaningfulContent(item.content || ''),
      }));

      const prompt = 콘텐츠_기반_필터링_프롬프트(newsWithId);
      const filtered = await chatJSON<{ id: number; title: string }[]>(prompt);

      return filtered.map((item) => newsItems[item.id]);
    } catch (error) {
      console.error('최종 필터링 중 오류 발생:', error);
      return newsItems.slice(0, 3);
    }
  }

  /**
   * 의존성 주입을 위한 생성자 (테스트용)
   *
   * @param collector - GoogleNewsCollector 인스턴스
   * @param extractor - GoogleNewsExtractor 인스턴스
   * @returns GoogleNewsService 인스턴스
   *
   * @example
   * // 테스트에서 Mock 주입
   * const service = GoogleNewsService.createWithDependencies(
   *   mockCollector,
   *   mockExtractor
   * );
   */
  static createWithDependencies(collector: GoogleNewsCollector, extractor: GoogleNewsExtractor): GoogleNewsService {
    const service = Object.create(GoogleNewsService.prototype);
    service.collector = collector;
    service.extractor = extractor;
    return service;
  }
}
