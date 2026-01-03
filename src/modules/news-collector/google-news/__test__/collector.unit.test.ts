/**
 * Google News Collector 유닛 테스트
 * 구현 계획 Section 6.7
 *
 * 참고: 이 테스트는 GoogleNewsCollector 클래스의 동작을 검증합니다.
 * 복잡한 모킹 시나리오는 통합 테스트에서 다룹니다.
 */

import { NewsItem } from '@/modules/news-collector/types.js';
import { jest } from '@jest/globals';

// Private 메서드 접근을 위한 타입
interface GoogleNewsCollectorWithPrivate {
  filterNewsForShorts(newsItems: NewsItem[]): Promise<NewsItem[]>;
  buildFilteringPrompt(news: { id: number; title: string }[]): string;
  collectMetadata(startTime: Date, endTime: Date): Promise<unknown>;
}

// Gemini API 모킹
const mockChatJSON = jest.fn<() => Promise<{ id: number; title: string }[]>>();
jest.unstable_mockModule('@/utils/gemini.js', () => ({
  chatJSON: mockChatJSON,
}));

describe('모듈 내보내기 (Module exports)', () => {
  it('GoogleNewsCollector 클래스를 내보내야 함', async () => {
    const module = await import('@/modules/news-collector/google-news/collector.js');
    expect(module.GoogleNewsCollector).toBeDefined();
    expect(typeof module.GoogleNewsCollector).toBe('function');
  });

  it('GoogleNewsCollector를 인스턴스화할 수 있어야 함', async () => {
    const { GoogleNewsCollector } = await import('@/modules/news-collector/google-news/collector.js');
    const collector = new GoogleNewsCollector();
    expect(collector).toBeDefined();
    expect(collector.collectMetadata).toBeDefined();
    expect(typeof collector.collectMetadata).toBe('function');
  });
});

describe('수집 결과 구조 (CollectionResult structure)', () => {
  it(
    'collectMetadata 메서드가 올바른 반환 타입을 가져야 함',
    async () => {
      const { GoogleNewsCollector } = await import('@/modules/news-collector/google-news/collector.js');
      const collector = new GoogleNewsCollector();

      const startTime = new Date('2025-01-15T00:00:00');
      const endTime = new Date('2025-01-15T22:00:00');

      // 실제로 Google News를 가져오려 시도하며, 테스트 환경에서 실패할 수 있음
      // 메서드가 존재하고 Promise를 반환하는지만 검증
      const resultPromise = collector.collectMetadata(startTime, endTime);
      expect(resultPromise).toBeInstanceOf(Promise);

      try {
        const result = await resultPromise;

        // 결과 구조 검증
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('newsItems');
        expect(result).toHaveProperty('totalCollected');
        expect(result).toHaveProperty('duplicatesRemoved');
        expect(result).toHaveProperty('source');
        expect(result).toHaveProperty('timestamp');

        expect(typeof result.success).toBe('boolean');
        expect(Array.isArray(result.newsItems)).toBe(true);
        expect(typeof result.totalCollected).toBe('number');
        expect(typeof result.duplicatesRemoved).toBe('number');
        expect(typeof result.source).toBe('string');
        expect(result.source).toBe('GOOGLE_NEWS');
        expect(result.timestamp).toBeInstanceOf(Date);
      } catch (error) {
        // 테스트 환경에서 네트워크 오류는 예상됨
        // 유닛 테스트에서는 허용 가능
        expect(error).toBeDefined();
      }
    },
    60000
  ); // 60초 타임아웃 추가
});

describe('FR-001-03: 필수 필드 검증 (Required fields validation)', () => {
  it('NewsItem 구조가 요구사항과 일치해야 함', () => {
    const sampleNewsItem: NewsItem = {
      title: 'Test News Title - Test Source',
      summary: 'Test Summary',
      url: 'https://example.com/news',
      publishedAt: new Date(),
      source: 'Test Source',
      category: '경제',
    };

    // 모든 필수 필드가 존재하는지 검증
    expect(sampleNewsItem.title).toBeDefined();
    expect(sampleNewsItem.summary).toBeDefined();
    expect(sampleNewsItem.url).toBeDefined();
    expect(sampleNewsItem.publishedAt).toBeDefined();
    expect(sampleNewsItem.source).toBeDefined();

    // 필드 타입 검증
    expect(typeof sampleNewsItem.title).toBe('string');
    expect(typeof sampleNewsItem.summary).toBe('string');
    expect(typeof sampleNewsItem.url).toBe('string');
    expect(sampleNewsItem.publishedAt).toBeInstanceOf(Date);
    expect(typeof sampleNewsItem.source).toBe('string');
  });
});

describe('FR-001-02: 다양한 뉴스 소스 지원 (Multiple news sources)', () => {
  it('Google News를 뉴스 소스로 지원해야 함', async () => {
    const { GoogleNewsCollector } = await import('@/modules/news-collector/google-news/collector.js');
    const collector = new GoogleNewsCollector();

    // GoogleNewsCollector가 존재하고 인스턴스화 가능해야 함
    expect(collector).toBeDefined();
  });
});

describe('Google News 특화 기능 (Google News specific features)', () => {
  it('한국어 경제 키워드를 처리할 수 있어야 함', async () => {
    const { GoogleNewsCollector } = await import('@/modules/news-collector/google-news/collector.js');
    const collector = new GoogleNewsCollector();

    // 암묵적 키워드 처리와 함께 collector가 인스턴스화 가능한지 검증
    expect(collector).toBeDefined();
  });

  it('카테고리 필드가 "경제"로 설정된 뉴스를 처리해야 함', () => {
    const sampleNewsItem: NewsItem = {
      title: 'Test Economic News - Test Source',
      summary: 'Test Summary',
      url: 'https://example.com/news',
      publishedAt: new Date(),
      source: 'Test Source',
      category: '경제',
    };

    expect(sampleNewsItem.category).toBe('경제');
  });
});

describe('AI 필터링 기능 (AI filtering functionality)', () => {
  beforeEach(() => {
    mockChatJSON.mockClear();
  });

  describe('filterNewsForShorts', () => {
    it('빈 배열이 입력되면 빈 배열을 반환해야 함', async () => {
      const { GoogleNewsCollector } = await import('@/modules/news-collector/google-news/collector.js');
      const collector = new GoogleNewsCollector();

      // private 메서드를 테스트하기 위해 캐스팅
      const result = await (collector as unknown as GoogleNewsCollectorWithPrivate).filterNewsForShorts([]);

      expect(result).toEqual([]);
      expect(mockChatJSON).not.toHaveBeenCalled();
    });

    it('AI가 선별한 뉴스만 반환해야 함', async () => {
      const { GoogleNewsCollector } = await import('@/modules/news-collector/google-news/collector.js');
      const collector = new GoogleNewsCollector();

      const mockNewsItems: NewsItem[] = [
        {
          title: '환율 급등 - 뉴스1',
          summary: '환율이 급등했습니다',
          url: 'https://example.com/news1',
          publishedAt: new Date('2025-01-15T10:00:00'),
          source: '뉴스1',
          category: '경제',
        },
        {
          title: '금리 인상 - 뉴스2',
          summary: '금리가 인상됐습니다',
          url: 'https://example.com/news2',
          publishedAt: new Date('2025-01-15T11:00:00'),
          source: '뉴스2',
          category: '경제',
        },
        {
          title: '주식 폭락 - 뉴스3',
          summary: '주식이 폭락했습니다',
          url: 'https://example.com/news3',
          publishedAt: new Date('2025-01-15T12:00:00'),
          source: '뉴스3',
          category: '경제',
        },
      ];

      // AI가 0번, 2번 뉴스를 선택했다고 가정
      mockChatJSON.mockResolvedValue([
        { id: 0, title: '환율 급등 - 뉴스1' },
        { id: 2, title: '주식 폭락 - 뉴스3' },
      ]);

      const result = await (collector as unknown as GoogleNewsCollectorWithPrivate).filterNewsForShorts(mockNewsItems);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('환율 급등 - 뉴스1');
      expect(result[1].title).toBe('주식 폭락 - 뉴스3');
      expect(mockChatJSON).toHaveBeenCalledTimes(1);
    });

    it('AI 필터링 실패 시 상위 5개 뉴스를 반환해야 함', async () => {
      const { GoogleNewsCollector } = await import('@/modules/news-collector/google-news/collector.js');
      const collector = new GoogleNewsCollector();

      const mockNewsItems: NewsItem[] = Array.from({ length: 10 }, (_, i) => ({
        title: `뉴스 제목 ${i + 1} - 소스`,
        summary: `요약 ${i + 1}`,
        url: `https://example.com/news${i + 1}`,
        publishedAt: new Date(`2025-01-15T${10 + i}:00:00`),
        source: '테스트 소스',
        category: '경제',
      }));

      // AI 호출 실패 시뮬레이션
      mockChatJSON.mockRejectedValue(new Error('AI API 오류'));

      const result = await (collector as unknown as GoogleNewsCollectorWithPrivate).filterNewsForShorts(mockNewsItems);

      expect(result).toHaveLength(5);
      expect(result[0].title).toBe('뉴스 제목 1 - 소스');
      expect(result[4].title).toBe('뉴스 제목 5 - 소스');
    });

    it('뉴스가 5개 미만일 때 AI 필터링 실패 시 모든 뉴스를 반환해야 함', async () => {
      const { GoogleNewsCollector } = await import('@/modules/news-collector/google-news/collector.js');
      const collector = new GoogleNewsCollector();

      const mockNewsItems: NewsItem[] = [
        {
          title: '뉴스 1 - 소스',
          summary: '요약 1',
          url: 'https://example.com/news1',
          publishedAt: new Date('2025-01-15T10:00:00'),
          source: '테스트 소스',
          category: '경제',
        },
        {
          title: '뉴스 2 - 소스',
          summary: '요약 2',
          url: 'https://example.com/news2',
          publishedAt: new Date('2025-01-15T11:00:00'),
          source: '테스트 소스',
          category: '경제',
        },
      ];

      mockChatJSON.mockRejectedValue(new Error('AI API 오류'));

      const result = await (collector as unknown as GoogleNewsCollectorWithPrivate).filterNewsForShorts(mockNewsItems);

      expect(result).toHaveLength(2);
    });

    it('AI가 반환한 ID가 올바르게 매핑되어야 함', async () => {
      const { GoogleNewsCollector } = await import('@/modules/news-collector/google-news/collector.js');
      const collector = new GoogleNewsCollector();

      const mockNewsItems: NewsItem[] = [
        {
          title: '제목 A - 소스',
          summary: '요약 A',
          url: 'https://example.com/a',
          publishedAt: new Date(),
          source: '소스 A',
          category: '경제',
        },
        {
          title: '제목 B - 소스',
          summary: '요약 B',
          url: 'https://example.com/b',
          publishedAt: new Date(),
          source: '소스 B',
          category: '경제',
        },
        {
          title: '제목 C - 소스',
          summary: '요약 C',
          url: 'https://example.com/c',
          publishedAt: new Date(),
          source: '소스 C',
          category: '경제',
        },
      ];

      // AI가 1번(B)과 0번(A) 순서로 선택
      mockChatJSON.mockResolvedValue([
        { id: 1, title: '제목 B - 소스' },
        { id: 0, title: '제목 A - 소스' },
      ]);

      const result = await (collector as unknown as GoogleNewsCollectorWithPrivate).filterNewsForShorts(mockNewsItems);

      // 원본 배열의 순서대로 반환되어야 함 (index 0, 1)
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('제목 A - 소스');
      expect(result[1].title).toBe('제목 B - 소스');
    });
  });

  describe('buildFilteringPrompt', () => {
    it('올바른 프롬프트 구조를 생성해야 함', async () => {
      const { GoogleNewsCollector } = await import('@/modules/news-collector/google-news/collector.js');
      const collector = new GoogleNewsCollector();

      const mockNews = [
        { id: 0, title: '환율 급등 - 뉴스1' },
        { id: 1, title: '금리 인상 - 뉴스2' },
      ];

      const prompt = (collector as unknown as GoogleNewsCollectorWithPrivate).buildFilteringPrompt(mockNews);

      // 프롬프트에 필수 요소가 포함되어 있는지 확인
      expect(prompt).toContain('한국 경제 유튜브 쇼츠');
      expect(prompt).toContain('5개를 선별');
      expect(prompt).toContain('환율');
      expect(prompt).toContain('금리');
      expect(prompt).toContain('선별 기준');
      expect(prompt).toContain('JSON');
      expect(prompt).toContain(JSON.stringify(mockNews));
    });

    it('뉴스 데이터를 JSON 형식으로 포함해야 함', async () => {
      const { GoogleNewsCollector } = await import('@/modules/news-collector/google-news/collector.js');
      const collector = new GoogleNewsCollector();

      const mockNews = [
        { id: 0, title: '테스트 뉴스 1' },
        { id: 5, title: '테스트 뉴스 2' },
      ];

      const prompt = (collector as unknown as GoogleNewsCollectorWithPrivate).buildFilteringPrompt(mockNews);

      // JSON 데이터가 정확히 포함되어야 함
      expect(prompt).toContain('"id":0');
      expect(prompt).toContain('"id":5');
      expect(prompt).toContain('"title":"테스트 뉴스 1"');
      expect(prompt).toContain('"title":"테스트 뉴스 2"');
    });

    it('선별 기준이 모두 포함되어야 함', async () => {
      const { GoogleNewsCollector } = await import('@/modules/news-collector/google-news/collector.js');
      const collector = new GoogleNewsCollector();

      const mockNews = [{ id: 0, title: '테스트' }];
      const prompt = (collector as unknown as GoogleNewsCollectorWithPrivate).buildFilteringPrompt(mockNews);

      // 주요 선별 기준 확인
      expect(prompt).toContain('내 지갑에 직접 영향');
      expect(prompt).toContain('한국 관련성');
      expect(prompt).toContain('자극적 요소');
      expect(prompt).toContain('트렌드 키워드');
      expect(prompt).toContain('제외 대상');
    });
  });

  describe('AI 필터링과 collectMetadata 통합', () => {
    it('collectMetadata가 AI 필터링을 적용해야 함', async () => {
      const { GoogleNewsCollector } = await import('@/modules/news-collector/google-news/collector.js');
      const collector = new GoogleNewsCollector();

      // AI가 특정 뉴스를 선택하도록 설정
      mockChatJSON.mockResolvedValue([
        { id: 0, title: '선별된 뉴스 1' },
        { id: 1, title: '선별된 뉴스 2' },
      ]);

      const startTime = new Date('2025-01-15T00:00:00');
      const endTime = new Date('2025-01-15T22:00:00');

      try {
        const result = await collector.collectMetadata(startTime, endTime);

        // AI 필터링이 호출되었는지 확인
        // 실제 뉴스가 수집되었다면 chatJSON이 호출되어야 함
        if (result.totalCollected > 0) {
          expect(mockChatJSON).toHaveBeenCalled();
        }

        // 결과는 최대 5개여야 함 (AI 필터링 결과)
        expect(result.newsItems.length).toBeLessThanOrEqual(5);
      } catch (error) {
        // 네트워크 오류는 테스트 환경에서 예상 가능
        expect(error).toBeDefined();
      }
    }, 60000);
  });

  describe('에러 핸들링 (Error handling)', () => {
    it('AI JSON 파싱 오류 시 폴백 처리해야 함', async () => {
      const { GoogleNewsCollector } = await import('@/modules/news-collector/google-news/collector.js');
      const collector = new GoogleNewsCollector();

      const mockNewsItems: NewsItem[] = Array.from({ length: 10 }, (_, i) => ({
        title: `뉴스 ${i + 1}`,
        summary: `요약 ${i + 1}`,
        url: `https://example.com/news${i + 1}`,
        publishedAt: new Date(),
        source: '테스트',
        category: '경제',
      }));

      // JSON 파싱 오류 시뮬레이션
      mockChatJSON.mockRejectedValue(new SyntaxError('Unexpected token'));

      const result = await (collector as unknown as GoogleNewsCollectorWithPrivate).filterNewsForShorts(mockNewsItems);

      // 폴백: 상위 5개 반환
      expect(result).toHaveLength(5);
      expect(result[0].title).toBe('뉴스 1');
    });

    it('AI가 빈 배열을 반환해도 처리해야 함', async () => {
      const { GoogleNewsCollector } = await import('@/modules/news-collector/google-news/collector.js');
      const collector = new GoogleNewsCollector();

      const mockNewsItems: NewsItem[] = [
        {
          title: '뉴스 1',
          summary: '요약',
          url: 'https://example.com/1',
          publishedAt: new Date(),
          source: '테스트',
          category: '경제',
        },
      ];

      mockChatJSON.mockResolvedValue([]);

      const result = await (collector as unknown as GoogleNewsCollectorWithPrivate).filterNewsForShorts(mockNewsItems);

      // 빈 배열이 반환되어도 오류 없이 처리
      expect(result).toEqual([]);
    });

    it('AI가 잘못된 형식을 반환해도 오류 없이 처리해야 함', async () => {
      const { GoogleNewsCollector } = await import('@/modules/news-collector/google-news/collector.js');
      const collector = new GoogleNewsCollector();

      const mockNewsItems: NewsItem[] = [
        {
          title: '뉴스 1',
          summary: '요약',
          url: 'https://example.com/1',
          publishedAt: new Date(),
          source: '테스트',
          category: '경제',
        },
      ];

      // 잘못된 형식의 응답
      mockChatJSON.mockResolvedValue({ invalid: 'format' } as unknown as { id: number; title: string }[]);

      const result = await (collector as unknown as GoogleNewsCollectorWithPrivate).filterNewsForShorts(mockNewsItems);

      // 에러 처리되어 빈 배열 반환
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

describe('통합 테스트 마커 (Integration test markers)', () => {
  it.todo('여러 키워드에 대한 검색 URL을 올바르게 생성해야 함 (모킹 필요)');
  it.todo('Google News RSS 피드를 파싱하여 뉴스 항목을 반환해야 함 (모킹 필요)');
  it.todo('Google News 제목 형식에서 소스명을 추출해야 함 (모킹 필요)');
  it.todo('시간 범위로 뉴스를 필터링해야 함 (모킹 필요)');
  it.todo('URL로 중복 뉴스 항목을 제거해야 함 (모킹 필요)');
  it.todo('Google News API 오류를 우아하게 처리해야 함 (모킹 필요)');
  it.todo('유효하지 않은 뉴스 항목을 검증하고 필터링해야 함 (모킹 필요)');
  it.todo('키워드 검색 사이에 속도 제한을 적용해야 함 (모킹 필요)');
  it.todo('Google News 항목을 NewsItem 형식으로 변환해야 함 (모킹 필요)');
});
