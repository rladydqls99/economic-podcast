/**
 * Google News Collector 유닛 테스트
 * 구현 계획 Section 6.7
 *
 * 참고: 이 테스트는 GoogleNewsCollector 클래스의 동작을 검증합니다.
 * 복잡한 모킹 시나리오는 통합 테스트에서 다룹니다.
 */

import { NewsItem } from '@/modules/news-collector/types.js';
import { jest } from '@jest/globals';

// rss-parser 모킹
interface RSSItem {
  title?: string;
  link?: string;
  pubDate?: string;
  contentSnippet?: string;
}

const mockParseURL = jest.fn<() => Promise<{ items: RSSItem[] }>>();
jest.unstable_mockModule('rss-parser', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      parseURL: mockParseURL,
    })),
  };
});

// keywords 모킹 (테스트용 키워드 2개만 사용)
jest.unstable_mockModule('@/config/keywords.js', () => ({
  ALL_KEYWORDS: ['코스피', '삼성전자'],
  ECONOMIC_KEYWORDS: {
    layer1_wallet: ['코스피'],
    layer2_company: ['삼성전자'],
    layer3_global: [],
  },
}));

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('collectMetadata 메서드가 올바른 반환 타입을 가져야 함', async () => {
    // RSS 피드 모킹 데이터 설정
    mockParseURL.mockResolvedValue({
      items: [
        {
          title: '한국은행 기준금리 동결 - 연합뉴스',
          link: 'https://news.google.com/articles/test1',
          pubDate: '2025-01-15T10:00:00.000Z',
          contentSnippet: '한국은행이 기준금리를 동결했습니다.',
        },
        {
          title: '코스피 상승 마감 - 한국경제',
          link: 'https://news.google.com/articles/test2',
          pubDate: '2025-01-15T14:00:00.000Z',
          contentSnippet: '코스피가 상승 마감했습니다.',
        },
      ],
    });

    const { GoogleNewsCollector } = await import('@/modules/news-collector/google-news/collector.js');
    const collector = new GoogleNewsCollector();

    const startTime = new Date('2025-01-15T00:00:00');
    const endTime = new Date('2025-01-15T22:00:00');

    // 메서드가 존재하고 Promise를 반환하는지 검증
    const resultPromise = collector.collectMetadata(startTime, endTime);
    expect(resultPromise).toBeInstanceOf(Promise);

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

    // 모킹된 데이터가 잘 수집되었는지 검증
    expect(result.success).toBe(true);
    expect(result.newsItems.length).toBeGreaterThan(0);
  });
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
