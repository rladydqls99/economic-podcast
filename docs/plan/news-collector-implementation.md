## 7. 디렉토리 구조 재구성 (사이트별 독립 구조)

✅ **구현 완료**

**⚠️ 아키텍처 변경**: 기존 flat 구조에서 **사이트별 독립 구조 (Option B)**로 전환합니다.

**변경 이유:**
- Google News RSS와 Naver API는 기사 **링크만** 제공 (본문 제공 안 함)
- 각 링크의 본문을 크롤링하려면 **사이트별 최적화된 Extractor** 필요
- 동적 콘텐츠("더보기" 버튼 등)는 Playwright, 정적 페이지는 Cheerio 사용
- 사이트별 독립 구조 = 유지보수성 향상, 변경 영향 최소화

### 7.1. 새로운 디렉토리 구조 생성

- [x] 사이트별 디렉토리 생성:

  ```bash
  mkdir -p src/modules/news-collector/google-news
  mkdir -p src/modules/news-collector/naver-news
  mkdir -p src/modules/news-collector/shared
  ```

### 7.2. 기존 파일 이동 및 재구성

- [x] 기존 `google-news-collector.ts` 파일을 `google-news/collector.ts`로 이동:

  ```bash
  mv src/modules/news-collector/google-news-collector.ts \
     src/modules/news-collector/google-news/collector.ts
  ```

- [x] `rss-collector.ts`는 그대로 유지 (RSS는 범용이므로 최상위 유지)

### 7.3. Playwright 패키지 설치

- [x] Playwright 설치:

  ```bash
  pnpm add playwright
  pnpm exec playwright install chromium
  ```

- [x] Playwright 타입 정의 확인:

  ```bash
  # playwright 패키지에 타입이 포함되어 있음
  ```

### 7.4. 아키텍처 개요 문서화

**새로운 구조:**
```
src/modules/news-collector/
├── google-news/
│   ├── collector.ts      # RSS에서 기사 메타데이터 수집
│   └── extractor.ts      # 각 링크의 본문 추출 (Playwright)
├── naver-news/
│   ├── collector.ts      # 네이버 API 또는 크롤링으로 메타데이터 수집
│   └── extractor.ts      # 네이버 기사 본문 추출
├── shared/
│   ├── playwright-manager.ts  # 브라우저 풀 관리
│   └── cheerio-utils.ts       # 공통 파싱 유틸
├── rss-collector.ts      # 범용 RSS 수집기 (기존)
├── deduplicator.ts       # 중복 제거
├── index.ts              # 메인 NewsCollector 통합 클래스
└── types.ts              # 공통 타입 (기존)
```

**책임 분리:**
- **Collector**: API/RSS에서 기사 메타데이터(제목, 링크, 날짜) 수집
- **Extractor**: 각 기사 링크에서 본문 추출
- **Shared**: 여러 Extractor에서 공통으로 사용하는 유틸리티

---

## 8. Shared Utilities 구현

### 8.1. Playwright Manager 구현 (FR-001-04)

- [x] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/shared/playwright-manager.ts` 파일 생성

- [x] Playwright Manager 클래스 구현:

  ```typescript
  import { chromium, Browser, BrowserContext, Page } from 'playwright';

  /**
   * Playwright 브라우저 풀 관리
   * - 브라우저 재사용으로 성능 향상
   * - 동시 요청 수 제한
   */
  export class PlaywrightManager {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private activeTabs = 0;
    private readonly MAX_CONCURRENT_TABS = 5;

    async initialize(): Promise<void> {
      if (!this.browser) {
        this.browser = await chromium.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        this.context = await this.browser.newContext({
          userAgent: 'Mozilla/5.0 (compatible; EconomicPodcastBot/1.0)',
        });
      }
    }

    async newPage(): Promise<Page> {
      if (!this.context) {
        await this.initialize();
      }

      // 동시 탭 수 제한
      while (this.activeTabs >= this.MAX_CONCURRENT_TABS) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      this.activeTabs++;
      const page = await this.context!.newPage();

      // 페이지 닫힐 때 카운터 감소
      page.on('close', () => {
        this.activeTabs--;
      });

      return page;
    }

    async close(): Promise<void> {
      if (this.context) {
        await this.context.close();
        this.context = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      this.activeTabs = 0;
    }
  }

  // 싱글톤 인스턴스
  export const playwrightManager = new PlaywrightManager();
  ```

### 8.2. Cheerio Utilities 구현

- [x] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/shared/cheerio-utils.ts` 파일 생성

- [x] 공통 파싱 유틸리티 함수 구현:

  ```typescript
  import * as cheerio from 'cheerio';

  /**
   * HTML에서 본문 텍스트 추출 (공통 패턴)
   */
  export function extractArticleContent(
    html: string,
    selectors: string[]
  ): string | null {
    const $ = cheerio.load(html);

    for (const selector of selectors) {
      const content = $(selector).text().trim();
      if (content && content.length > 100) {
        return content;
      }
    }

    return null;
  }

  /**
   * 불필요한 요소 제거 (광고, 스크립트 등)
   */
  export function cleanHtml(html: string): string {
    const $ = cheerio.load(html);

    // 광고, 스크립트, 스타일 제거
    $('script, style, iframe, .ad, .advertisement').remove();

    return $.html();
  }

  /**
   * 메타 태그에서 정보 추출
   */
  export function extractMetaContent(
    html: string,
    property: string
  ): string | null {
    const $ = cheerio.load(html);
    return $(`meta[property="${property}"]`).attr('content') || null;
  }
  ```

### 8.3. Shared Utilities 테스트

- [x] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/shared/__test__/playwright-manager.unit.test.ts` 생성
- [x] Playwright Manager 초기화 테스트
- [x] 브라우저 재사용 테스트
- [x] 동시 탭 제한 테스트
- [x] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/shared/__test__/cheerio-utils.unit.test.ts` 생성
- [x] HTML 파싱 유틸리티 테스트

---

## 9. Google News Extractor 구현 (FR-001-03, FR-001-04)

### 9.1. Google News Extractor 파일 생성

- [x] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/google-news/extractor.ts` 파일 생성

### 9.2. Extractor 클래스 구현

- [x] 기본 구조 작성:

  ```typescript
  import { playwrightManager } from '../shared/playwright-manager.js';
  import { extractArticleContent } from '../shared/cheerio-utils.js';
  import { NewsItem } from '../types.js';

  /**
   * Google News 링크의 실제 기사 본문 추출
   * FR-001-03: 기사 본문 필수 필드 추출
   * FR-001-04: 동적 콘텐츠 지원
   */
  export class GoogleNewsExtractor {
    private readonly REQUEST_DELAY = 1000; // 1초 딜레이

    /**
     * 단일 기사 URL에서 본문 추출
     */
    async extractContent(newsItem: NewsItem): Promise<NewsItem> {
      const page = await playwrightManager.newPage();

      try {
        // 페이지 로드
        await page.goto(newsItem.url, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });

        // 동적 콘텐츠 대기 (필요시)
        await page.waitForTimeout(2000);

        // HTML 가져오기
        const html = await page.content();

        // 본문 추출 시도 (여러 셀렉터)
        const content = extractArticleContent(html, [
          'article',
          '.article-content',
          '.news-content',
          '#articleBody',
          'main',
        ]);

        return {
          ...newsItem,
          content: content || newsItem.summary,
        };
      } catch (error) {
        console.error(`기사 본문 추출 실패 [${newsItem.url}]:`, error);
        // 실패 시 원본 반환
        return newsItem;
      } finally {
        await page.close();
        await this.delay(this.REQUEST_DELAY);
      }
    }

    /**
     * 여러 기사 일괄 처리
     */
    async extractMultiple(newsItems: NewsItem[]): Promise<NewsItem[]> {
      const results: NewsItem[] = [];

      for (const item of newsItems) {
        const extracted = await this.extractContent(item);
        results.push(extracted);
      }

      return results;
    }

    private delay(ms: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
  }
  ```

### 9.3. Google News Collector와 Extractor 통합

- [x] `google-news/collector.ts` 수정하여 Extractor 호출 추가:
- [x] **추가 구현**: `google-news/service.ts` 생성 (Service 레이어 패턴)

  ```typescript
  import { GoogleNewsExtractor } from './extractor.js';

  export class GoogleNewsCollector {
    // ... 기존 코드 ...
    private extractor: GoogleNewsExtractor;

    constructor() {
      this.parser = new Parser({ timeout: env.newsCollectionTimeout });
      this.extractor = new GoogleNewsExtractor();
    }

    async collectNews(startTime: Date, endTime: Date): Promise<CollectionResult> {
      // ... 기존 수집 로직 ...

      // ✅ 본문 추출 추가
      const newsWithContent = await this.extractor.extractMultiple(allNews);

      return {
        success: newsWithContent.length > 0,
        newsItems: newsWithContent,
        totalCollected: newsWithContent.length,
        duplicatesRemoved: 0,
        source: 'GOOGLE_NEWS',
        timestamp: new Date(),
        errors: errors.length > 0 ? errors : undefined,
      };
    }
  }
  ```

### 9.4. Google News Extractor 테스트

- [ ] ⚠️ **미완료**: 테스트 파일은 아직 생성되지 않음
- [ ] 단일 기사 본문 추출 테스트
- [ ] 여러 기사 일괄 처리 테스트
- [ ] 추출 실패 시 원본 반환 테스트
- [ ] Rate limiting 테스트

---

## 10. Naver News Collector 구현

### 10.1. Naver News Collector 파일 생성

- [ ] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/naver-news/collector.ts` 파일 생성

### 10.2. Naver News API 설정

- [ ] 네이버 개발자 센터에서 API 키 발급 (선택사항)
- [ ] `.env`에 환경 변수 추가:

  ```
  NAVER_CLIENT_ID=your_client_id
  NAVER_CLIENT_SECRET=your_client_secret
  ```

### 10.3. Naver News Collector 구현

- [ ] Collector 클래스 작성:

  ```typescript
  import axios from 'axios';
  import { env } from '@/config/env.js';
  import { NewsItem, CollectionResult } from '../types.js';
  import { isValidNewsItem } from '../types.js';
  import { isWithinRange } from '@/utils/date-time.js';

  const SEARCH_KEYWORDS = ['한국경제', '금융시장', '주식시장', '환율', '부동산'];

  /**
   * 네이버 뉴스 검색 API 수집기
   * FR-001-02: 네이버 뉴스 소스 지원
   */
  export class NaverNewsCollector {
    private readonly BASE_URL = 'https://openapi.naver.com/v1/search/news.json';

    async collectNews(startTime: Date, endTime: Date): Promise<CollectionResult> {
      const allNews: NewsItem[] = [];
      const errors: string[] = [];
      const urlSet = new Set<string>();

      for (const keyword of SEARCH_KEYWORDS) {
        try {
          await this.delay(1000);

          const news = await this.searchByKeyword(keyword);

          // 시간 필터링 및 중복 제거
          for (const item of news) {
            if (
              isWithinRange(item.publishedAt, startTime, endTime) &&
              !urlSet.has(item.url)
            ) {
              allNews.push(item);
              urlSet.add(item.url);
            }
          }
        } catch (error) {
          const errorMsg = `네이버 뉴스 검색 실패 [${keyword}]: ${error}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      return {
        success: allNews.length > 0,
        newsItems: allNews,
        totalCollected: allNews.length,
        duplicatesRemoved: 0,
        source: 'NAVER_NEWS',
        timestamp: new Date(),
        errors: errors.length > 0 ? errors : undefined,
      };
    }

    private async searchByKeyword(keyword: string): Promise<NewsItem[]> {
      try {
        const response = await axios.get(this.BASE_URL, {
          params: {
            query: keyword,
            display: 20,
            sort: 'date',
          },
          headers: {
            'X-Naver-Client-Id': env.naverClientId,
            'X-Naver-Client-Secret': env.naverClientSecret,
          },
          timeout: 30000,
        });

        return response.data.items.map((item: any) =>
          this.convertToNewsItem(item)
        );
      } catch (error) {
        console.error(`네이버 API 호출 실패 [${keyword}]:`, error);
        return [];
      }
    }

    private convertToNewsItem(item: any): NewsItem {
      return {
        title: this.stripHtmlTags(item.title),
        summary: this.stripHtmlTags(item.description),
        url: item.link,
        publishedAt: new Date(item.pubDate),
        source: '네이버뉴스',
        category: '경제',
      };
    }

    private stripHtmlTags(html: string): string {
      return html.replace(/<[^>]*>/g, '');
    }

    private delay(ms: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
  }
  ```

### 10.4. 환경 변수 추가

- [ ] `src/config/env.ts`에 네이버 API 키 추가:

  ```typescript
  export const env = {
    // ... 기존 코드 ...
    naverClientId: process.env.NAVER_CLIENT_ID || '',
    naverClientSecret: process.env.NAVER_CLIENT_SECRET || '',
  };
  ```

---

## 11. Naver News Extractor 구현

### 11.1. Naver News Extractor 파일 생성

- [ ] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/naver-news/extractor.ts` 파일 생성

### 11.2. Extractor 클래스 구현

- [ ] 네이버 뉴스 본문 추출 (Playwright 사용):

  ```typescript
  import { playwrightManager } from '../shared/playwright-manager.js';
  import { NewsItem } from '../types.js';

  /**
   * 네이버 뉴스 본문 추출
   * - 동적 콘텐츠 처리 (댓글 로드, 이미지 로드 등)
   */
  export class NaverNewsExtractor {
    private readonly REQUEST_DELAY = 1000;

    async extractContent(newsItem: NewsItem): Promise<NewsItem> {
      const page = await playwrightManager.newPage();

      try {
        await page.goto(newsItem.url, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });

        // 네이버 뉴스 본문 셀렉터
        const content = await page.evaluate(() => {
          const selectors = [
            '#newsct_article',
            '#articeBody',
            '.article_body',
            '#articleBodyContents',
          ];

          for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
              return element.textContent?.trim() || null;
            }
          }

          return null;
        });

        return {
          ...newsItem,
          content: content || newsItem.summary,
        };
      } catch (error) {
        console.error(`네이버 뉴스 본문 추출 실패 [${newsItem.url}]:`, error);
        return newsItem;
      } finally {
        await page.close();
        await this.delay(this.REQUEST_DELAY);
      }
    }

    async extractMultiple(newsItems: NewsItem[]): Promise<NewsItem[]> {
      const results: NewsItem[] = [];

      for (const item of newsItems) {
        const extracted = await this.extractContent(item);
        results.push(extracted);
      }

      return results;
    }

    private delay(ms: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
  }
  ```

### 11.3. Naver Collector와 Extractor 통합

- [ ] `naver-news/collector.ts`에 Extractor 연동 추가

---

## 12. 중복 제거 로직 구현 (FR-001-06)

### 12.1. Deduplicator 파일 생성

- [ ] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/deduplicator.ts` 파일 생성

### 12.2. Deduplicator 클래스 구현

- [ ] 중복 제거 로직 작성:

  ```typescript
  import { NewsItem } from './types.js';
  import { isDuplicate } from '@/utils/text-similarity.js';

  /**
   * 뉴스 중복 제거 클래스
   * FR-001-06: 유사도 90% 이상 기사 자동 제거
   */
  export class NewsDeduplicator {
    private similarityThreshold: number;

    constructor(threshold: number = 0.9) {
      this.similarityThreshold = threshold;
    }

    /**
     * 모든 중복 제거 로직 적용
     */
    removeDuplicates(newsItems: NewsItem[]): NewsItem[] {
      console.log(`중복 제거 전 뉴스 개수: ${newsItems.length}`);

      // 1단계: URL 기반 중복 제거
      let deduped = this.removeDuplicatesByUrl(newsItems);
      console.log(`URL 중복 제거 후: ${deduped.length}`);

      // 2단계: 유사도 기반 중복 제거
      deduped = this.removeSimilarNews(deduped);
      console.log(`유사도 중복 제거 후: ${deduped.length}`);

      const removed = newsItems.length - deduped.length;
      console.log(`총 ${removed}개 중복 제거됨`);

      return deduped;
    }

    /**
     * URL 기반 정확한 중복 제거
     */
    private removeDuplicatesByUrl(newsItems: NewsItem[]): NewsItem[] {
      const seen = new Set<string>();
      return newsItems.filter((item) => {
        if (seen.has(item.url)) {
          return false;
        }
        seen.add(item.url);
        return true;
      });
    }

    /**
     * 제목 유사도 기반 중복 제거 (90% 이상)
     */
    private removeSimilarNews(newsItems: NewsItem[]): NewsItem[] {
      const result: NewsItem[] = [];

      for (const item of newsItems) {
        let isDup = false;

        for (const existing of result) {
          if (isDuplicate(item.title, existing.title, this.similarityThreshold)) {
            isDup = true;
            break;
          }
        }

        if (!isDup) {
          result.push(item);
        }
      }

      return result;
    }
  }
  ```

### 12.3. Deduplicator 테스트

- [ ] `/Users/kim-yongbin/projects/economic-podcast/tests/unit/news-collector/deduplicator.test.ts` 생성
- [ ] URL 중복 제거 테스트
- [ ] 유사도 90% 이상 중복 제거 테스트
- [ ] 유사도 89% 미만 유지 테스트

---

## 13. 메인 NewsCollector 통합 클래스 구현

### 13.1. Main Collector 파일 생성

- [ ] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/index.ts` 파일 작성

### 13.2. NewsCollector 메인 클래스 구현

- [ ] 모든 수집기 통합:

  ```typescript
  import { RSSCollector } from './rss-collector.js';
  import { GoogleNewsCollector } from './google-news/collector.js';
  import { NaverNewsCollector } from './naver-news/collector.js';
  import { NewsDeduplicator } from './deduplicator.js';
  import { playwrightManager } from './shared/playwright-manager.js';
  import { NewsItem } from './types.js';
  import { getTodayNewsRange } from '@/utils/date-time.js';
  import { isValidNewsItem } from './types.js';

  /**
   * 뉴스 수집 메인 클래스
   * FR-001: 뉴스 수집 모듈 통합
   */
  export class NewsCollector {
    private rssCollector: RSSCollector;
    private googleNewsCollector: GoogleNewsCollector;
    private naverNewsCollector: NaverNewsCollector;
    private deduplicator: NewsDeduplicator;
    private minNewsCount: number;

    constructor(minNewsCount: number = 20) {
      this.rssCollector = new RSSCollector();
      this.googleNewsCollector = new GoogleNewsCollector();
      this.naverNewsCollector = new NaverNewsCollector();
      this.deduplicator = new NewsDeduplicator(0.9);
      this.minNewsCount = minNewsCount;
    }

    /**
     * 일일 뉴스 수집 (0시~22시)
     * FR-001-01: 당일 0시~22시 뉴스 수집
     */
    async collectDailyNews(): Promise<NewsItem[]> {
      console.log('=== 일일 뉴스 수집 시작 ===');
      const startTime = Date.now();

      try {
        // Playwright 초기화
        await playwrightManager.initialize();

        // 1. 오늘 날짜 범위
        const { startOfDay, endOfDay } = getTodayNewsRange();
        console.log(`수집 범위: ${startOfDay.toISOString()} ~ ${endOfDay.toISOString()}`);

        // 2. 모든 소스에서 병렬 수집
        const results = await Promise.allSettled([
          this.rssCollector.collectNews(startOfDay, endOfDay),
          this.googleNewsCollector.collectNews(startOfDay, endOfDay),
          this.naverNewsCollector.collectNews(startOfDay, endOfDay),
        ]);

        // 3. 결과 통합
        const allNews: NewsItem[] = [];
        results.forEach((result, index) => {
          const sourceName = ['RSS', 'Google News', 'Naver News'][index];
          if (result.status === 'fulfilled' && result.value.success) {
            console.log(`${sourceName}: ${result.value.newsItems.length}개 수집`);
            allNews.push(...result.value.newsItems);
          } else if (result.status === 'rejected') {
            console.error(`${sourceName} 수집 실패:`, result.reason);
          }
        });

        console.log(`총 수집된 뉴스: ${allNews.length}개`);

        // 4. 유효성 검증
        const validNews = allNews.filter(isValidNewsItem);
        console.log(`유효한 뉴스: ${validNews.length}개`);

        // 5. 중복 제거
        const deduplicatedNews = this.deduplicator.removeDuplicates(validNews);

        // 6. 최소 개수 검증
        if (deduplicatedNews.length < this.minNewsCount) {
          throw new Error(
            `수집된 뉴스 부족: ${deduplicatedNews.length}개 (최소 ${this.minNewsCount}개 필요)`
          );
        }

        // 7. 최신순 정렬
        deduplicatedNews.sort(
          (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
        );

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`=== 뉴스 수집 완료: ${deduplicatedNews.length}개 (${duration}초) ===`);

        return deduplicatedNews;
      } finally {
        // Playwright 정리
        await playwrightManager.close();
      }
    }
  }

  // 공개 API 내보내기
  export { NewsItem, CollectionResult } from './types.js';
  export { NewsCollector };
  ```

### 13.3. Main Collector 테스트

- [ ] `/Users/kim-yongbin/projects/economic-podcast/tests/integration/news-collector.test.ts` 생성
- [ ] 전체 수집 프로세스 end-to-end 테스트

---

## 14. 로깅 통합

### 14.1. Winston 설치 및 설정

- [ ] Winston 설치:

  ```bash
  pnpm add winston
  ```

- [ ] `/Users/kim-yongbin/projects/economic-podcast/src/modules/logger/index.ts` 생성

### 14.2. Logger 설정

- [ ] Winston logger 구성:

  ```typescript
  import winston from 'winston';

  export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.simple(),
      }),
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
      }),
    ],
  });
  ```

### 14.3. console.log를 logger로 교체

- [ ] 모든 Collector에서 `console.log` → `logger.info` 변경
- [ ] 모든 `console.error` → `logger.error` 변경

---

## 15. 설정 관리 (Constants)

### 15.1. Constants 파일 생성

- [ ] `/Users/kim-yongbin/projects/economic-podcast/src/config/constants.ts` 생성

### 15.2. 뉴스 수집 설정 정의

- [ ] 설정 상수 작성:

  ```typescript
  export const NEWS_COLLECTOR_CONFIG = {
    MIN_NEWS_COUNT: 20,
    SIMILARITY_THRESHOLD: 0.9,
    REQUEST_TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    CRAWL_DELAY: 1000,
  };

  export const RSS_FEEDS = [
    { name: '조선일보', url: 'https://www.chosun.com/arc/outboundfeeds/rss/category/economy/?outputType=xml' },
    { name: '동아일보', url: 'https://rss.donga.com/economy.xml' },
    { name: '매일경제', url: 'https://www.mk.co.kr/rss/30100041/' },
    { name: '한국경제', url: 'https://www.hankyung.com/feed/economy' },
  ];

  export const GOOGLE_NEWS_KEYWORDS = [
    '한국경제',
    '금융시장',
    '주식시장',
    '환율',
    '부동산시장',
  ];

  export const NAVER_NEWS_KEYWORDS = [
    '한국경제',
    '금융시장',
    '주식시장',
    '환율',
    '부동산',
  ];
  ```

---

## 16. 에러 처리 및 재시도 로직

### 16.1. Retry Utility 생성

- [ ] `/Users/kim-yongbin/projects/economic-podcast/src/utils/retry.ts` 파일 생성

- [ ] Exponential backoff 재시도 함수:

  ```typescript
  export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt);
          console.log(`재시도 ${attempt + 1}/${maxRetries} (${delay}ms 후)`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }
  ```

### 16.2. 수집기에 재시도 로직 적용

- [ ] Google News Collector에 재시도 적용
- [ ] Naver News Collector에 재시도 적용
- [ ] Extractor에 재시도 적용

---

## 17. 단위 테스트 작성

### 17.1. Extractor 테스트

- [ ] Google News Extractor 테스트
- [ ] Naver News Extractor 테스트
- [ ] 본문 추출 실패 시 fallback 테스트

### 17.2. Deduplicator 테스트

- [ ] URL 중복 제거 테스트
- [ ] 유사도 중복 제거 테스트

### 17.3. Main Collector 테스트

- [ ] Mock을 사용한 통합 테스트
- [ ] 최소 개수 미달 시 에러 테스트

---

## 18. 통합 테스트 작성

### 18.1. End-to-End 테스트

- [ ] 실제 환경에서 뉴스 수집 테스트 (최소 20개)
- [ ] 모든 필드 검증
- [ ] 중복 제거 검증

---

## 19. 수용 기준 검증 (FR-001)

### 19.1. FR-001-01: 시간 범위 필터링

- [ ] 당일 0시~22시 뉴스만 수집 확인

### 19.2. FR-001-02: 다중 소스

- [x] RSS ✅
- [x] Google News ✅
- [ ] Naver News ❌

### 19.3. FR-001-03: 필수 필드

- [x] 제목, 요약, URL, 발행시간, 언론사 ✅
- [ ] **기사 본문** ❌

### 19.4. FR-001-04: 본문 추출

- [ ] 정적 페이지 (Cheerio)
- [ ] 동적 페이지 (Playwright)

### 19.5. FR-001-05: 날짜 필터링

- [x] 시간 범위 필터링 ✅

### 19.6. FR-001-06: 중복 제거

- [ ] 90% 유사도 중복 제거 ❌

---

## 20. 모듈 완료 체크리스트

### 20.1. 기능 요구사항 완료 확인

- [x] **FR-001-01**: 당일 0시~22시 뉴스 수집 ✅
- [ ] **FR-001-02**: 3개 소스 (RSS, Google, Naver) ⚠️ 2/3
- [ ] **FR-001-03**: 필수 필드 + 본문 ⚠️ 본문 미구현
- [ ] **FR-001-04**: 본문 추출 (동적/정적) ❌
- [x] **FR-001-05**: 날짜 필터링 ✅
- [ ] **FR-001-06**: 중복 제거 ❌

### 20.2. 다음 단계

1. **즉시 진행**: Naver News Collector + Extractor 구현
2. **즉시 진행**: Deduplicator 구현
3. **즉시 진행**: Main NewsCollector 통합
4. **이후 진행**: 테스트, 로깅, 문서화
