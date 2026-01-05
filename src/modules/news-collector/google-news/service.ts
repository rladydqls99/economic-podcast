import { CollectionResult } from '../types.js';
import { GoogleNewsCollector } from './collector.js';
import { GoogleNewsExtractor } from './extractor.js';

/**
 * Google News 수집 서비스
 *
 * @description
 * Collector와 Extractor를 조율하여 전체 뉴스 수집 파이프라인 관리
 *
 * **파이프라인**:
 * 1. Collector: RSS에서 메타데이터 수집 (title, url, publishedAt 등)
 * 2. Extractor: 각 URL 방문하여 본문 추출
 * 3. 결과 통합 및 CollectionResult 생성
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
      // Step 1: RSS에서 메타데이터 수집
      console.log(`[GoogleNewsService] Step 1: 메타데이터 수집 시작`);
      const metadataResult = await this.collector.collectMetadata(startTime, endTime);

      if (!metadataResult.success) {
        errors.push(...(metadataResult.errors || []));
      }

      const newsItems = metadataResult.newsItems;
      console.log(`[GoogleNewsService] 메타데이터 수집 완료: ${newsItems.length}개`);

      // Step 2: 본문 추출
      console.log(`[GoogleNewsService] Step 2: 본문 추출 시작: ${newsItems.length}개`);
      const newsWithContent = await this.extractor.extractMultiple(newsItems);
      console.log(`[GoogleNewsService] 본문 추출 완료: ${newsWithContent.length}개`);

      // Step 3: 결과 생성
      const endTimestamp = Date.now();
      const duration = ((endTimestamp - startTimestamp) / 1000).toFixed(2);
      console.log(`[GoogleNewsService] 전체 처리 완료 (소요시간: ${duration}초)`);

      console.log(newsWithContent);

      return {
        success: newsWithContent.length > 0,
        newsItems: newsWithContent,
        totalCollected: newsWithContent.length,
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
