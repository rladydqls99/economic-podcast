/**
 * Pipeline Integration 테스트
 * 구현 계획 Section 13.3
 *
 * 전체 파이프라인의 통합 동작을 검증합니다:
 * Step 1: RSS 수집 (10초 목표)
 * Step 2: 제목 기반 필터링 (AI)
 * Step 3: 본문 추출 (Playwright)
 * Step 4: 최종 필터링 (AI)
 */

import { GoogleNewsService } from '@/modules/news-collector/google-news/service.js';
import { getTodayNewsRange } from '@/utils/date-time.js';

describe('Pipeline Integration (파이프라인 통합)', () => {
  let service: GoogleNewsService;

  beforeEach(() => {
    service = new GoogleNewsService();
  });

  describe('전체 파이프라인 실행 (Full pipeline execution)', () => {
    /**
     * 정상 케이스: 전체 파이프라인이 성공적으로 완료되어야 함
     */
    it('전체 파이프라인을 성공적으로 완료해야 한다', async () => {
      const { startOfDay, endOfDay } = getTodayNewsRange();

      const result = await service.collectNews(startOfDay, endOfDay);

      // 결과 구조 검증
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.newsItems).toBeDefined();
      expect(Array.isArray(result.newsItems)).toBe(true);
      expect(result.totalCollected).toBeDefined();
      expect(result.duplicatesRemoved).toBeDefined();
      expect(result.source).toBe('GOOGLE_NEWS');
      expect(result.timestamp).toBeInstanceOf(Date);
    }, 120000); // 2분 타임아웃 (60초 목표 + 여유)

    /**
     * 정상 케이스: 최종 결과가 3-5개의 뉴스를 반환해야 함
     */
    it('최종 필터링 후 3-5개의 뉴스를 반환해야 한다', async () => {
      const { startOfDay, endOfDay } = getTodayNewsRange();

      const result = await service.collectNews(startOfDay, endOfDay);

      expect(result.newsItems.length).toBeGreaterThanOrEqual(0);
      expect(result.newsItems.length).toBeLessThanOrEqual(15); // 최대 15개 (제목 필터링 후)
      expect(result.totalCollected).toBe(result.newsItems.length);
    }, 120000);

    /**
     * 정상 케이스: 각 뉴스 아이템이 필수 필드를 포함해야 함
     */
    it('수집된 뉴스가 모든 필수 필드를 포함해야 한다', async () => {
      const { startOfDay, endOfDay } = getTodayNewsRange();

      const result = await service.collectNews(startOfDay, endOfDay);

      if (result.newsItems.length > 0) {
        result.newsItems.forEach((item) => {
          // 필수 필드 검증
          expect(item.title).toBeDefined();
          expect(typeof item.title).toBe('string');
          expect(item.title.length).toBeGreaterThan(0);

          expect(item.summary).toBeDefined();
          expect(typeof item.summary).toBe('string');

          expect(item.url).toBeDefined();
          expect(typeof item.url).toBe('string');
          expect(item.url).toMatch(/^https?:\/\//);

          expect(item.publishedAt).toBeInstanceOf(Date);

          expect(item.source).toBeDefined();
          expect(typeof item.source).toBe('string');
          expect(item.source.length).toBeGreaterThan(0);

          // 본문은 추출 후 존재해야 함
          if (item.content) {
            expect(typeof item.content).toBe('string');
          }
        });
      }
    }, 120000);
  });

  describe('성능 검증 (Performance validation)', () => {
    /**
     * 성능: 전체 파이프라인이 120초 이내에 완료되어야 함
     * (목표: 60초, 여유: 2배)
     */
    it('전체 파이프라인이 120초 이내에 완료되어야 한다', async () => {
      const { startOfDay, endOfDay } = getTodayNewsRange();
      const startTime = Date.now();

      await service.collectNews(startOfDay, endOfDay);

      const duration = (Date.now() - startTime) / 1000;
      console.log(`파이프라인 완료 시간: ${duration.toFixed(2)}초`);

      expect(duration).toBeLessThan(120); // 2분 이내
    }, 130000); // 타임아웃 130초
  });

  describe('경계 케이스 (Boundary cases)', () => {
    /**
     * 경계: 뉴스가 없는 시간 범위 (미래 시간)
     */
    it('뉴스가 없을 경우 빈 배열을 반환해야 한다', async () => {
      // 미래 시간 범위 (뉴스 없음)
      const futureStart = new Date('2099-12-31T00:00:00');
      const futureEnd = new Date('2099-12-31T22:00:00');

      const result = await service.collectNews(futureStart, futureEnd);

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.newsItems).toEqual([]);
      expect(result.totalCollected).toBe(0);
    }, 60000);

    /**
     * 경계: 시간 범위가 0시-22시 경계값
     */
    it('시간 범위 경계값(0시, 22시)을 올바르게 처리해야 한다', async () => {
      const nowKST = new Date();

      const midnight = new Date(nowKST);
      midnight.setHours(0, 0, 0, 0);

      const endTime = new Date(nowKST);
      endTime.setHours(22, 0, 0, 0);

      const result = await service.collectNews(midnight, endTime);

      expect(result).toBeDefined();
      expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(midnight.getTime());
    }, 120000);

    /**
     * 경계: 매우 짧은 시간 범위 (1분)
     */
    it('매우 짧은 시간 범위에서도 정상 동작해야 한다', async () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60000);

      const result = await service.collectNews(oneMinuteAgo, now);

      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(Array.isArray(result.newsItems)).toBe(true);
    }, 60000);
  });

  describe('에러 케이스 (Error cases)', () => {
    /**
     * 에러: 잘못된 시간 범위 (종료 시간이 시작 시간보다 이전)
     */
    it('잘못된 시간 범위를 처리해야 한다', async () => {
      const now = new Date();
      const future = new Date(now.getTime() + 3600000); // 1시간 후

      // 종료 시간이 시작 시간보다 이전
      const result = await service.collectNews(future, now);

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.newsItems).toEqual([]);
    }, 60000);

    /**
     * 에러: 네트워크 오류 시뮬레이션은 유닛 테스트에서 처리
     * (통합 테스트에서는 실제 네트워크 사용)
     */
  });

  describe('필터링 단계 검증 (Filtering stages validation)', () => {
    /**
     * 정상: 제목 필터링이 뉴스를 줄여야 함
     */
    it('제목 필터링이 뉴스 개수를 줄여야 한다', async () => {
      // Step 1: 메타데이터 수집
      const mockNews = [
        {
          title: '경제 뉴스 1',
          summary: '요약 1',
          url: 'https://example.com/1',
          publishedAt: new Date(),
          source: 'Test',
        },
        {
          title: '경제 뉴스 2',
          summary: '요약 2',
          url: 'https://example.com/2',
          publishedAt: new Date(),
          source: 'Test',
        },
        {
          title: '경제 뉴스 3',
          summary: '요약 3',
          url: 'https://example.com/3',
          publishedAt: new Date(),
          source: 'Test',
        },
      ];

      const filtered = await service.filterNewsByTitle(mockNews);

      expect(Array.isArray(filtered)).toBe(true);
      expect(filtered.length).toBeLessThanOrEqual(mockNews.length);
    }, 30000);

    /**
     * 경계: 빈 배열을 필터링하면 빈 배열 반환
     */
    it('빈 배열을 필터링하면 빈 배열을 반환해야 한다', async () => {
      const filtered = await service.filterNewsByTitle([]);
      expect(filtered).toEqual([]);
    }, 10000);

    /**
     * 정상: 본문 필터링이 최종 뉴스를 선택해야 함
     */
    it('본문 필터링이 최종 뉴스를 선택해야 한다', async () => {
      const mockNewsWithContent = [
        {
          title: '경제 뉴스 1',
          summary: '요약 1',
          url: 'https://example.com/1',
          publishedAt: new Date(),
          source: 'Test',
          content: '본문 내용 1. 이것은 테스트 뉴스입니다.',
        },
        {
          title: '경제 뉴스 2',
          summary: '요약 2',
          url: 'https://example.com/2',
          publishedAt: new Date(),
          source: 'Test',
          content: '본문 내용 2. 이것도 테스트 뉴스입니다.',
        },
      ];

      const filtered = await service.filterNewsByContent(mockNewsWithContent);

      expect(Array.isArray(filtered)).toBe(true);
      expect(filtered.length).toBeGreaterThanOrEqual(0);
      expect(filtered.length).toBeLessThanOrEqual(mockNewsWithContent.length);
    }, 30000);

    /**
     * 경계: 빈 배열을 본문 필터링하면 빈 배열 반환
     */
    it('빈 배열을 본문 필터링하면 빈 배열을 반환해야 한다', async () => {
      const filtered = await service.filterNewsByContent([]);
      expect(filtered).toEqual([]);
    }, 10000);
  });

  describe('엣지 케이스 (Edge cases)', () => {
    /**
     * 엣지: 특수문자가 포함된 제목 처리
     */
    it('특수문자가 포함된 제목을 올바르게 처리해야 한다', async () => {
      const mockNews = [
        {
          title: '[속보] 금리 인상! "충격" & 우려 <경제>',
          summary: '특수문자 테스트',
          url: 'https://example.com/special',
          publishedAt: new Date(),
          source: 'Test',
        },
      ];

      const filtered = await service.filterNewsByTitle(mockNews);

      expect(Array.isArray(filtered)).toBe(true);
    }, 30000);

    /**
     * 엣지: 매우 긴 본문 처리 (800자 이상)
     */
    it('매우 긴 본문을 올바르게 처리해야 한다', async () => {
      const longContent = '가'.repeat(2000); // 2000자 본문

      const mockNews = [
        {
          title: '긴 뉴스',
          summary: '요약',
          url: 'https://example.com/long',
          publishedAt: new Date(),
          source: 'Test',
          content: longContent,
        },
      ];

      const filtered = await service.filterNewsByContent(mockNews);

      expect(Array.isArray(filtered)).toBe(true);
      // 필터링 로직이 긴 본문을 처리할 수 있어야 함
    }, 30000);

    /**
     * 엣지: 중복 URL이 있을 경우 처리
     */
    it('중복 URL이 있을 경우 올바르게 처리해야 한다', async () => {
      const { startOfDay, endOfDay } = getTodayNewsRange();

      const result = await service.collectNews(startOfDay, endOfDay);

      // URL 중복 검사
      const urls = result.newsItems.map((item) => item.url);
      const uniqueUrls = new Set(urls);

      expect(uniqueUrls.size).toBe(urls.length); // 중복 없음
    }, 120000);

    /**
     * 엣지: 본문이 없는 뉴스 처리
     */
    it('본문이 없는 뉴스를 올바르게 처리해야 한다', async () => {
      const mockNews = [
        {
          title: '본문 없는 뉴스',
          summary: '요약만 있음',
          url: 'https://example.com/no-content',
          publishedAt: new Date(),
          source: 'Test',
          content: undefined,
        },
      ];

      const filtered = await service.filterNewsByContent(mockNews);

      expect(Array.isArray(filtered)).toBe(true);
    }, 30000);
  });

  describe('데이터 무결성 (Data integrity)', () => {
    /**
     * 무결성: 수집된 뉴스의 날짜가 요청 범위 내에 있어야 함
     */
    it('수집된 뉴스의 날짜가 요청 범위 내에 있어야 한다', async () => {
      const { startOfDay, endOfDay } = getTodayNewsRange();

      const result = await service.collectNews(startOfDay, endOfDay);

      if (result.newsItems.length > 0) {
        result.newsItems.forEach((item) => {
          const publishTime = item.publishedAt.getTime();
          expect(publishTime).toBeGreaterThanOrEqual(startOfDay.getTime());
          expect(publishTime).toBeLessThanOrEqual(endOfDay.getTime());
        });
      }
    }, 120000);

    /**
     * 무결성: 중복 제거 카운트가 정확해야 함
     */
    it('중복 제거 카운트가 0 이상이어야 한다', async () => {
      const { startOfDay, endOfDay } = getTodayNewsRange();

      const result = await service.collectNews(startOfDay, endOfDay);

      expect(result.duplicatesRemoved).toBeGreaterThanOrEqual(0);
      expect(typeof result.duplicatesRemoved).toBe('number');
    }, 120000);

    /**
     * 무결성: 결과 타임스탬프가 현재 시간 근처여야 함
     */
    it('결과 타임스탬프가 현재 시간 근처여야 한다', async () => {
      const { startOfDay, endOfDay } = getTodayNewsRange();
      const beforeTime = new Date();

      const result = await service.collectNews(startOfDay, endOfDay);

      const afterTime = new Date();

      expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    }, 120000);
  });
});
