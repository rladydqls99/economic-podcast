# FR-001: 뉴스 수집 모듈 구현 체크리스트

**문서 버전:** 1.0
**작성일:** 2025-12-19
**담당 모듈:** 뉴스 수집 모듈 (News Collection Module)
**우선순위:** P0 (필수)
**예상 소요 기간:** 1-2주
**의존성:** 없음 (첫 번째 구현 모듈)

---

## 목차

1. [개요](#1-개요)
2. [환경 설정 및 사전 준비](#2-환경-설정-및-사전-준비)
3. [핵심 타입 및 인터페이스 정의](#3-핵심-타입-및-인터페이스-정의)
4. [유틸리티 함수 구현](#4-유틸리티-함수-구현)
5. [RSS 피드 수집기 구현](#5-rss-피드-수집기-구현)
6. [Google News 수집기 구현](#6-google-news-수집기-구현)
7. [웹 크롤링 수집기 구현](#7-웹-크롤링-수집기-구현)
8. [중복 제거 로직 구현](#8-중복-제거-로직-구현)
9. [메인 뉴스 수집 모듈 통합](#9-메인-뉴스-수집-모듈-통합)
10. [로깅 통합](#10-로깅-통합)
11. [설정 관리](#11-설정-관리)
12. [에러 처리 및 재시도 로직](#12-에러-처리-및-재시도-로직)
13. [단위 테스트 작성](#13-단위-테스트-작성)
14. [통합 테스트 작성](#14-통합-테스트-작성)
15. [수용 기준 검증](#15-수용-기준-검증)
16. [성능 최적화](#16-성능-최적화)
17. [문서화](#17-문서화)
18. [코드 리뷰 및 정리](#18-코드-리뷰-및-정리)
19. [최종 검증 및 배포 준비](#19-최종-검증-및-배포-준비)
20. [모듈 완료 체크리스트](#20-모듈-완료-체크리스트)

---

## 1. 개요

### 1.1. 모듈 목적

한국 경제 관련 뉴스를 다양한 소스에서 자동으로 수집하여 후속 이슈 추출 및 대본 생성 모듈에 전달합니다.

### 1.2. 주요 요구사항 요약 (PRD 섹션 5.1)

- **FR-001-01**: 당일 0시~22시 사이 뉴스 수집
- **FR-001-02**: 최소 3개 이상 뉴스 소스 지원 (RSS, Google News, 웹 크롤링)
- **FR-001-03**: 필수 필드 포함 (제목, 요약, 링크, 발행시간, 언론사명)
- **FR-001-04**: 발행 시간 기준 필터링
- **FR-001-05**: 중복 제거 (유사도 90% 이상)

### 1.3. 기술 스택

- TypeScript 5.x
- axios (HTTP 클라이언트)
- cheerio (HTML 파싱)
- rss-parser (RSS 피드 파싱)
- string-similarity (텍스트 유사도 계산)
- date-fns (날짜/시간 처리)

### 1.4. 데이터 구조 (PRD 섹션 8.1)

```typescript
interface NewsItem {
  title: string; // 뉴스 제목
  summary: string; // 요약/리드
  url: string; // 원문 링크
  publishedAt: Date; // 발행 시간
  source: string; // 언론사명
  category?: string; // 카테고리
}
```

---

## 2. 환경 설정 및 사전 준비

### 2.1. 개발 환경 확인

- [x] Node.js 18.x 이상 설치 확인

  ```bash
  node --version
  ```

- [x] TypeScript 설치 확인

  ```bash
  npx tsc --version
  ```

- [x] 프로젝트 의존성 설치 확인

  ```bash
  pnpm install
  ```

- [ ] ESLint 및 Prettier 설정 확인
  - [x] `.eslintrc.js` 또는 `.eslintrc.json` 파일 확인
  - [x] `.prettierrc` 파일 확인
  - [x] `package.json`에 lint 스크립트 추가

### 2.2. 디렉토리 구조 생성 (PRD 섹션 7.3)

- [x] 모듈 디렉토리 구조 생성:

  ```bash
  mkdir -p src/modules/news-collector
  mkdir -p src/config
  mkdir -p src/utils
  mkdir -p data/temp
  mkdir -p logs
  ```

- [x] PRD 섹션 7.3의 디렉토리 구조와 일치하는지 확인:
  - [x] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/`
  - [x] `/Users/kim-yongbin/projects/economic-podcast/src/config/`
  - [x] `/Users/kim-yongbin/projects/economic-podcast/src/utils/`
  - [x] `/Users/kim-yongbin/projects/economic-podcast/data/`
  - [x] `/Users/kim-yongbin/projects/economic-podcast/logs/`

### 2.3. 환경 변수 설정 (PRD 섹션 6.3)

- [x] `.env` 파일이 없으면 생성

  ```bash
  touch .env
  ```

- [x] `.gitignore`에 `.env` 추가 확인

- [x] `.env.example` 파일 생성 및 필수 환경 변수 추가:

  ```
  NODE_ENV=development
  PORT=3000
  LOG_LEVEL=info

  # 뉴스 수집 관련 설정
  NEWS_COLLECTION_TIMEOUT=30000
  MIN_NEWS_COUNT=20
  DEDUPLICATION_THRESHOLD=0.9
  ```

- [ ] dotenv 패키지 설치 확인:
  ```bash
  pnpm add dotenv
  ```

---

## 3. 핵심 타입 및 인터페이스 정의

### 3.1. 타입 정의 파일 생성 (FR-001-03)

- [x] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/types.ts` 파일 생성

### 3.2. NewsItem 인터페이스 정의 (PRD 섹션 8.1)

- [x] `NewsItem` 인터페이스 정의 및 JSDoc 주석 추가:
  ```typescript
  /**
   * 수집된 뉴스 아이템 인터페이스
   * PRD 섹션 8.1 데이터 구조 참조
   */
  export interface NewsItem {
    title: string; // 뉴스 제목 (필수)
    summary: string; // 요약/리드 (필수)
    url: string; // 원문 링크 (필수)
    publishedAt: Date; // 발행 시간 (필수)
    source: string; // 언론사명 (필수)
    category?: string; // 카테고리 (선택)
  }
  ```

### 3.3. 설정 인터페이스 정의

- [x] `NewsCollectorConfig` 인터페이스 정의:
  ```typescript
  /**
   * 뉴스 수집기 설정 인터페이스
   */
  export interface NewsCollectorConfig {
    startTime: Date; // 수집 시작 시간 (FR-001-01: 당일 0시)
    endTime: Date; // 수집 종료 시간 (FR-001-01: 당일 22시)
    minNewsCount: number; // 최소 수집 뉴스 개수 (기본값: 20)
    similarityThreshold: number; // 중복 판단 유사도 임계값 (FR-001-05: 0.9)
  }
  ```

### 3.4. 수집 결과 인터페이스 정의

- [x] `CollectionResult` 인터페이스 정의:
  ```typescript
  /**
   * 뉴스 수집 결과 인터페이스
   */
  export interface CollectionResult {
    success: boolean;
    newsItems: NewsItem[];
    totalCollected: number;
    duplicatesRemoved: number;
    source: string;
    timestamp: Date;
    errors?: string[];
  }
  ```

### 3.5. 뉴스 소스 타입 정의 (FR-001-02)

- [x] `NewsSource` 열거형 정의:

  ```typescript
  /**
   * 뉴스 소스 타입 (FR-001-02: 최소 3개 소스)
   */
  export enum NewsSourceType {
    RSS_FEED = 'RSS_FEED',
    GOOGLE_NEWS = 'GOOGLE_NEWS',
    WEB_CRAWL = 'WEB_CRAWL',
  }

  export interface NewsSource {
    name: string;
    type: NewsSourceType;
    url: string;
    enabled: boolean;
  }
  ```

---

## 4. 유틸리티 함수 구현

### 4.1. 날짜/시간 유틸리티 생성 (FR-001-01, FR-001-04)

- [x] `/Users/kim-yongbin/projects/economic-podcast/src/utils/date-time.ts` 파일 생성

- [x] KST(한국 표준시) 현재 시간 가져오기 함수 구현:

  ```typescript
  import { addHours } from 'date-fns';

  /**
   * 한국 표준시(KST) 현재 시간 반환
   * UTC+9 시간대 적용
   */
  export function getKSTDate(): Date {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + 9 * 60 * 60 * 1000);
  }
  ```

- [x] 오늘 날짜 범위 가져오기 함수 구현 (FR-001-01):

  ```typescript
  /**
   * 오늘 뉴스 수집 범위 반환 (0시 ~ 22시)
   * FR-001-01: 당일 0시~22시 사이 뉴스 수집
   */
  export function getTodayNewsRange(): { start: Date; end: Date } {
    const now = getKSTDate();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(22, 0, 0, 0);

    return { start, end };
  }
  ```

- [x] 날짜 범위 체크 함수 구현 (FR-001-04):

  ```typescript
  /**
   * 날짜가 주어진 범위 내에 있는지 확인
   * FR-001-04: 발행 시간 기준 필터링
   */
  export function isWithinRange(date: Date, start: Date, end: Date): boolean {
    const time = date.getTime();
    return time >= start.getTime() && time <= end.getTime();
  }
  ```

- [ ] 날짜/시간 유틸리티 단위 테스트 작성:
  - [ ] KST 시간대 변환 테스트
  - [ ] 날짜 범위 계산 테스트 (0시, 22시 경계값)
  - [ ] 날짜 비교 로직 테스트

### 4.2. 텍스트 유사도 유틸리티 생성 (FR-001-05)

- [x] `/Users/kim-yongbin/projects/economic-podcast/src/utils/similarity.ts` 파일 생성

- [x] 필요한 패키지 설치:

  ```bash
  pnpm add string-similarity
  pnpm add -D @types/string-similarity
  ```

- [x] 문자열 유사도 계산 함수 구현:

  ```typescript
  import { compareTwoStrings } from 'string-similarity';

  /**
   * 두 문자열 간 유사도 계산 (0.0 ~ 1.0)
   */
  export function calculateSimilarity(str1: string, str2: string): number {
    const normalized1 = normalizeText(str1);
    const normalized2 = normalizeText(str2);
    return compareTwoStrings(normalized1, normalized2);
  }
  ```

- [x] 텍스트 정규화 함수 구현:

  ```typescript
  /**
   * 텍스트 정규화 (공백 제거, 소문자 변환 등)
   */
  export function normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ') // 다중 공백 -> 단일 공백
      .trim();
  }
  ```

- [x] 중복 판단 함수 구현 (FR-001-05):

  ```typescript
  /**
   * 두 제목이 중복인지 판단 (유사도 90% 이상)
   * FR-001-05: 유사도 90% 이상 기사 자동 제거
   */
  export function isDuplicate(title1: string, title2: string, threshold: number = 0.9): boolean {
    const similarity = calculateSimilarity(title1, title2);
    return similarity >= threshold;
  }
  ```

- [ ] 유사도 유틸리티 단위 테스트 작성:
  - [ ] 완전 일치 테스트 (유사도 = 1.0)
  - [ ] 유사 제목 테스트 (유사도 > 0.9)
  - [ ] 다른 제목 테스트 (유사도 < 0.9)
  - [ ] 텍스트 정규화 테스트

### 4.3. URL 검증 유틸리티 생성 (FR-001-03)

- [x] `/Users/kim-yongbin/projects/economic-podcast/src/utils/validation.ts` 파일 생성

- [x] URL 유효성 검증 함수 구현:

  ```typescript
  /**
   * URL 형식 유효성 검증
   * FR-001-03: 원문 링크 필수 필드 검증
   */
  export function isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }
  ```

- [x] NewsItem 유효성 검증 함수 구현 (FR-001-03):

  ```typescript
  import { NewsItem } from '../modules/news-collector/types';

  /**
   * NewsItem 필수 필드 유효성 검증
   * FR-001-03: 모든 필수 필드 포함 확인
   */
  export function isValidNewsItem(item: NewsItem): boolean {
    return !!(
      item.title &&
      item.title.trim().length > 0 &&
      item.summary &&
      item.summary.trim().length > 0 &&
      item.url &&
      isValidUrl(item.url) &&
      item.publishedAt &&
      item.publishedAt instanceof Date &&
      !isNaN(item.publishedAt.getTime()) &&
      item.source &&
      item.source.trim().length > 0
    );
  }
  ```

- [ ] 검증 유틸리티 단위 테스트 작성:
  - [ ] 유효한 URL 테스트
  - [ ] 잘못된 URL 테스트
  - [ ] 유효한 NewsItem 테스트
  - [ ] 필수 필드 누락 시 실패 테스트

---

## 5. RSS 피드 수집기 구현

### 5.1. RSS 수집기 모듈 파일 생성 (FR-001-02 소스 1)

- [ ] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/rss-collector.ts` 파일 생성

- [x] 필요한 패키지 설치:

  ```bash
  pnpm add rss-parser axios
  ```

- [ ] 필요한 라이브러리 임포트:
  ```typescript
  import Parser from 'rss-parser';
  import axios from 'axios';
  import { NewsItem, CollectionResult } from './types';
  import { isWithinRange } from '../../utils/date-time';
  import { isValidNewsItem } from '../../utils/validation';
  ```

### 5.2. RSS 피드 URL 설정

- [ ] RSS 피드 URL 배열 정의 (FR-001-02: 최소 3개 소스):
  ```typescript
  const RSS_FEEDS = [
    {
      name: '한국경제',
      url: 'https://www.hankyung.com/feed/economy',
    },
    {
      name: '매일경제',
      url: 'https://www.mk.co.kr/rss/30100041/',
    },
    {
      name: '서울경제',
      url: 'https://www.sedaily.com/RSS/S1N1.xml',
    },
  ];
  ```

### 5.3. RSS 수집기 클래스 구현

- [x] `RSSCollector` 클래스 기본 구조 작성:

  ```typescript
  /**
   * RSS 피드 뉴스 수집기
   * FR-001-02: RSS 피드를 통한 뉴스 수집
   */
  export class RSSCollector {
    private parser: Parser;

    constructor() {
      this.parser = new Parser({
        timeout: 30000, // PRD TR-004-03: 타임아웃 30초
      });
    }

    async collectNews(startTime: Date, endTime: Date): Promise<CollectionResult> {
      // 구현 예정
    }
  }
  ```

### 5.4. RSS 피드 파싱 로직 구현

- [x] 단일 RSS 피드 수집 메서드 구현:

  ```typescript
  /**
   * 단일 RSS 피드에서 뉴스 수집
   */
  private async fetchRSSFeed(
    feedUrl: string,
    sourceName: string
  ): Promise<NewsItem[]> {
    try {
      const feed = await this.parser.parseURL(feedUrl);
      const newsItems: NewsItem[] = [];

      for (const item of feed.items) {
        const newsItem = this.convertRSSItemToNewsItem(item, sourceName);
        if (newsItem && isValidNewsItem(newsItem)) {
          newsItems.push(newsItem);
        }
      }

      return newsItems;
    } catch (error) {
      console.error(`RSS 피드 수집 실패 [${sourceName}]:`, error);
      return [];
    }
  }
  ```

- [x] RSS 아이템을 NewsItem으로 변환 (FR-001-03):
  ```typescript
  /**
   * RSS 아이템을 NewsItem 형식으로 변환
   * FR-001-03: 필수 필드 매핑
   */
  private convertRSSItemToNewsItem(
    item: any,
    sourceName: string
  ): NewsItem | null {
    try {
      return {
        title: item.title || '',
        summary: item.contentSnippet || item.content || item.description || '',
        url: item.link || '',
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        source: sourceName,
        category: item.categories?.[0] || undefined,
      };
    } catch (error) {
      console.error('RSS 아이템 변환 실패:', error);
      return null;
    }
  }
  ```

### 5.5. 시간 필터링 및 메인 수집 메서드 (FR-001-04)

- [x] 메인 수집 메서드 구현:

  ```typescript
  /**
   * 모든 RSS 피드에서 뉴스 수집
   * FR-001-04: 시간 범위 필터링 적용
   */
  async collectNews(startTime: Date, endTime: Date): Promise<CollectionResult> {
    const allNews: NewsItem[] = [];
    const errors: string[] = [];

    for (const feed of RSS_FEEDS) {
      try {
        const news = await this.fetchRSSFeed(feed.url, feed.name);
        // 시간 필터링 적용
        const filtered = news.filter(item =>
          isWithinRange(item.publishedAt, startTime, endTime)
        );
        allNews.push(...filtered);
      } catch (error) {
        const errorMsg = `RSS 피드 수집 실패 [${feed.name}]: ${error}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return {
      success: allNews.length > 0,
      newsItems: allNews,
      totalCollected: allNews.length,
      duplicatesRemoved: 0, // 중복 제거는 나중 단계에서 수행
      source: 'RSS_FEED',
      timestamp: new Date(),
      errors: errors.length > 0 ? errors : undefined,
    };
  }
  ```

### 5.6. 에러 처리 및 재시도 로직 (PRD TR-004)

- [ ] 네트워크 에러 처리 추가 (try-catch)
- [ ] 타임아웃 설정 확인 (30초)
- [ ] 개별 RSS 피드 실패 시 다른 피드 계속 수집
- [ ] 모든 에러 로깅

### 5.7. RSS 수집기 단위 테스트

- [ ] `/Users/kim-yongbin/projects/economic-podcast/tests/unit/news-collector/rss-collector.test.ts` 파일 생성
- [ ] RSS 피드 파싱 성공 테스트 (Mock 데이터 사용)
- [ ] 시간 필터링 로직 테스트
- [ ] 잘못된 RSS 피드 처리 테스트
- [ ] 필수 필드 누락 처리 테스트

---

## 6. Google News 수집기 구현

### 6.1. Google News 수집기 모듈 파일 생성 (FR-001-02 소스 2)

- [ ] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/google-news-collector.ts` 파일 생성

- [ ] 필요한 라이브러리 임포트:
  ```typescript
  import Parser from 'rss-parser';
  import { NewsItem, CollectionResult } from './types';
  import { isWithinRange } from '../../utils/date-time';
  import { isValidNewsItem } from '../../utils/validation';
  ```

### 6.2. Google News 검색 설정

- [ ] Google News RSS 기본 URL 및 검색 키워드 정의:

  ```typescript
  const GOOGLE_NEWS_BASE_URL = 'https://news.google.com/rss/search';

  // 한국 경제 관련 검색 키워드
  const SEARCH_KEYWORDS = ['한국경제', '금융시장', '주식시장', '환율', '부동산시장'];
  ```

### 6.3. Google News 수집기 클래스 구현

- [ ] `GoogleNewsCollector` 클래스 기본 구조:

  ```typescript
  /**
   * Google News RSS 뉴스 수집기
   * FR-001-02: Google News를 통한 뉴스 수집
   */
  export class GoogleNewsCollector {
    private parser: Parser;

    constructor() {
      this.parser = new Parser({
        timeout: 30000,
      });
    }

    async collectNews(startTime: Date, endTime: Date): Promise<CollectionResult> {
      // 구현 예정
    }
  }
  ```

### 6.4. Google News 검색 URL 생성

- [ ] 검색 URL 생성 메서드 구현:
  ```typescript
  /**
   * Google News RSS 검색 URL 생성
   */
  private buildSearchUrl(keyword: string, language: string = 'ko'): string {
    const params = new URLSearchParams({
      q: keyword,
      hl: language,
      gl: 'KR',
      ceid: 'KR:ko',
    });
    return `${GOOGLE_NEWS_BASE_URL}?${params.toString()}`;
  }
  ```

### 6.5. Google News RSS 파싱 (FR-001-03)

- [ ] 단일 키워드 검색 메서드 구현:

  ```typescript
  /**
   * 키워드로 Google News 검색
   */
  private async searchByKeyword(keyword: string): Promise<NewsItem[]> {
    try {
      const url = this.buildSearchUrl(keyword);
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
      console.error(`Google News 검색 실패 [${keyword}]:`, error);
      return [];
    }
  }
  ```

- [ ] Google News 아이템 변환 메서드:

  ```typescript
  /**
   * Google News RSS 아이템을 NewsItem으로 변환
   */
  private convertGoogleNewsItem(item: any): NewsItem | null {
    try {
      // Google News는 언론사명이 제목에 포함되어 있음
      const title = item.title || '';
      const sourceName = this.extractSourceName(title);

      return {
        title: title,
        summary: item.contentSnippet || item.content || '',
        url: item.link || '',
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        source: sourceName || 'Google News',
        category: '경제',
      };
    } catch (error) {
      console.error('Google News 아이템 변환 실패:', error);
      return null;
    }
  }
  ```

- [ ] 언론사명 추출 헬퍼 메서드:
  ```typescript
  /**
   * 제목에서 언론사명 추출
   * 예: "제목 - 언론사" 형식
   */
  private extractSourceName(title: string): string | null {
    const match = title.match(/- (.+)$/);
    return match ? match[1].trim() : null;
  }
  ```

### 6.6. 메인 수집 메서드 및 중복 제거 (FR-001-04)

- [ ] 메인 수집 메서드 구현:

  ```typescript
  /**
   * 모든 키워드로 Google News 검색 및 수집
   * FR-001-04: 시간 범위 필터링 적용
   */
  async collectNews(startTime: Date, endTime: Date): Promise<CollectionResult> {
    const allNews: NewsItem[] = [];
    const errors: string[] = [];
    const urlSet = new Set<string>(); // URL 기반 중복 제거

    for (const keyword of SEARCH_KEYWORDS) {
      try {
        // Rate limiting을 위한 딜레이
        await this.delay(1000);

        const news = await this.searchByKeyword(keyword);

        // 시간 필터링 및 URL 중복 제거
        for (const item of news) {
          if (isWithinRange(item.publishedAt, startTime, endTime) &&
              !urlSet.has(item.url)) {
            allNews.push(item);
            urlSet.add(item.url);
          }
        }
      } catch (error) {
        const errorMsg = `Google News 검색 실패 [${keyword}]: ${error}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return {
      success: allNews.length > 0,
      newsItems: allNews,
      totalCollected: allNews.length,
      duplicatesRemoved: 0,
      source: 'GOOGLE_NEWS',
      timestamp: new Date(),
      errors: errors.length > 0 ? errors : undefined,
    };
  }
  ```

- [ ] 딜레이 헬퍼 메서드:
  ```typescript
  /**
   * Rate limiting을 위한 딜레이
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  ```

### 6.7. Google News 수집기 단위 테스트

- [ ] `/Users/kim-yongbin/projects/economic-podcast/tests/unit/news-collector/google-news-collector.test.ts` 파일 생성
- [ ] URL 생성 테스트 (다양한 키워드)
- [ ] Google News RSS 파싱 테스트 (Mock 데이터)
- [ ] 언론사명 추출 테스트
- [ ] 시간 필터링 테스트

---

## 7. 웹 크롤링 수집기 구현

### 7.1. 웹 크롤러 모듈 파일 생성 (FR-001-02 소스 3)

- [ ] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/web-crawler.ts` 파일 생성

- [ ] 필요한 패키지 설치:

  ```bash
  pnpm add cheerio axios
  ```

- [ ] 필요한 라이브러리 임포트:
  ```typescript
  import axios from 'axios';
  import * as cheerio from 'cheerio';
  import { NewsItem, CollectionResult } from './types';
  import { isWithinRange } from '../../utils/date-time';
  import { isValidNewsItem } from '../../utils/validation';
  ```

### 7.2. 크롤링 대상 사이트 설정

- [ ] 크롤링 대상 웹사이트 설정 정의:

  ```typescript
  interface SiteConfig {
    name: string;
    url: string;
    selectors: {
      articleList: string;
      title: string;
      summary: string;
      link: string;
      date: string;
    };
  }

  const CRAWL_TARGETS: SiteConfig[] = [
    {
      name: '한국은행 보도자료',
      url: 'https://www.bok.or.kr/portal/bbs/B0000245/list.do',
      selectors: {
        articleList: '.bd-list tbody tr',
        title: '.tit a',
        summary: '.tit a',
        link: '.tit a',
        date: '.date',
      },
    },
    // 필요시 추가 사이트 설정
  ];
  ```

### 7.3. 웹 크롤러 클래스 구현

- [ ] `WebCrawler` 클래스 기본 구조:

  ```typescript
  /**
   * 웹 크롤링 뉴스 수집기
   * FR-001-02: 웹 크롤링을 통한 뉴스 수집
   */
  export class WebCrawler {
    private readonly REQUEST_DELAY = 2000; // 2초 딜레이 (robots.txt 준수)

    constructor() {}

    async collectNews(startTime: Date, endTime: Date): Promise<CollectionResult> {
      // 구현 예정
    }
  }
  ```

### 7.4. HTML 페이지 가져오기

- [ ] HTML 페이지 요청 메서드 구현:
  ```typescript
  /**
   * 웹 페이지 HTML 가져오기
   */
  private async fetchPage(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; EconomicPodcastBot/1.0)',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`페이지 가져오기 실패 [${url}]:`, error);
      throw error;
    }
  }
  ```

### 7.5. HTML 파싱 및 뉴스 추출 (FR-001-03)

- [ ] HTML에서 뉴스 추출 메서드 구현:

  ```typescript
  /**
   * HTML에서 뉴스 항목 추출
   */
  private parseNewsSite(
    html: string,
    config: SiteConfig
  ): NewsItem[] {
    const $ = cheerio.load(html);
    const newsItems: NewsItem[] = [];

    $(config.selectors.articleList).each((_, element) => {
      try {
        const title = $(element).find(config.selectors.title).text().trim();
        const linkElem = $(element).find(config.selectors.link);
        const url = this.resolveUrl(linkElem.attr('href') || '', config.url);
        const dateText = $(element).find(config.selectors.date).text().trim();
        const publishedAt = this.parseDate(dateText);

        if (title && url) {
          newsItems.push({
            title,
            summary: title, // 크롤링에서는 제목을 요약으로 사용
            url,
            publishedAt,
            source: config.name,
            category: '경제',
          });
        }
      } catch (error) {
        console.error('뉴스 항목 파싱 실패:', error);
      }
    });

    return newsItems;
  }
  ```

- [ ] URL 해석 헬퍼 메서드:
  ```typescript
  /**
   * 상대 URL을 절대 URL로 변환
   */
  private resolveUrl(href: string, baseUrl: string): string {
    try {
      return new URL(href, baseUrl).toString();
    } catch {
      return href;
    }
  }
  ```

### 7.6. 날짜 파싱

- [ ] 날짜 파싱 메서드 구현:

  ```typescript
  /**
   * 다양한 날짜 형식 파싱
   * 예: "2025-12-19", "2시간 전", "오늘" 등
   */
  private parseDate(dateString: string): Date {
    // ISO 형식 시도
    const isoDate = new Date(dateString);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    // 상대 시간 처리
    if (dateString.includes('시간 전')) {
      const hours = parseInt(dateString);
      const date = new Date();
      date.setHours(date.getHours() - hours);
      return date;
    }

    if (dateString.includes('오늘')) {
      return new Date();
    }

    // 파싱 실패 시 현재 시간 반환
    return new Date();
  }
  ```

### 7.7. 메인 수집 메서드 (FR-001-04)

- [ ] 메인 수집 메서드 구현:

  ```typescript
  /**
   * 모든 크롤링 대상에서 뉴스 수집
   * FR-001-04: 시간 범위 필터링 적용
   */
  async collectNews(startTime: Date, endTime: Date): Promise<CollectionResult> {
    const allNews: NewsItem[] = [];
    const errors: string[] = [];

    for (const target of CRAWL_TARGETS) {
      try {
        // Rate limiting
        await this.delay(this.REQUEST_DELAY);

        const html = await this.fetchPage(target.url);
        const news = this.parseNewsSite(html, target);

        // 시간 필터링
        const filtered = news.filter(item =>
          isWithinRange(item.publishedAt, startTime, endTime) &&
          isValidNewsItem(item)
        );

        allNews.push(...filtered);
      } catch (error) {
        const errorMsg = `크롤링 실패 [${target.name}]: ${error}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return {
      success: allNews.length > 0,
      newsItems: allNews,
      totalCollected: allNews.length,
      duplicatesRemoved: 0,
      source: 'WEB_CRAWL',
      timestamp: new Date(),
      errors: errors.length > 0 ? errors : undefined,
    };
  }
  ```

- [ ] 딜레이 메서드:
  ```typescript
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  ```

### 7.8. 웹 크롤러 단위 테스트

- [ ] `/Users/kim-yongbin/projects/economic-podcast/tests/unit/news-collector/web-crawler.test.ts` 파일 생성
- [ ] HTML 파싱 테스트 (샘플 HTML 사용)
- [ ] 날짜 파싱 테스트 (다양한 형식)
- [ ] URL 해석 테스트 (상대 URL → 절대 URL)
- [ ] 요소 누락 시 에러 처리 테스트

---

## 8. 중복 제거 로직 구현

### 8.1. 중복 제거 모듈 파일 생성 (FR-001-05)

- [ ] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/deduplicator.ts` 파일 생성

- [ ] 필요한 라이브러리 임포트:
  ```typescript
  import { NewsItem } from './types';
  import { isDuplicate } from '../../utils/similarity';
  ```

### 8.2. 중복 제거 클래스 구현

- [ ] `NewsDeduplicator` 클래스 기본 구조:

  ```typescript
  /**
   * 뉴스 중복 제거 클래스
   * FR-001-05: 유사도 90% 이상 기사 자동 제거
   */
  export class NewsDeduplicator {
    private similarityThreshold: number;

    constructor(threshold: number = 0.9) {
      this.similarityThreshold = threshold;
    }

    removeDuplicates(newsItems: NewsItem[]): NewsItem[] {
      // 구현 예정
    }
  }
  ```

### 8.3. URL 기반 중복 제거

- [ ] URL 중복 제거 메서드:
  ```typescript
  /**
   * URL 기반 정확한 중복 제거
   */
  private removeDuplicatesByUrl(newsItems: NewsItem[]): NewsItem[] {
    const seen = new Set<string>();
    return newsItems.filter(item => {
      if (seen.has(item.url)) {
        return false;
      }
      seen.add(item.url);
      return true;
    });
  }
  ```

### 8.4. 유사도 기반 중복 제거 (FR-001-05)

- [ ] 유사도 기반 중복 제거 메서드:

  ```typescript
  /**
   * 제목 유사도 기반 중복 제거 (90% 이상)
   * FR-001-05: 유사도 90% 이상 기사 자동 제거
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
  ```

### 8.5. 메인 중복 제거 메서드

- [ ] 메인 중복 제거 메서드 구현:

  ```typescript
  /**
   * 모든 중복 제거 로직 적용
   * 1. URL 기반 정확한 중복 제거
   * 2. 제목 유사도 기반 중복 제거 (90% 이상)
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
  ```

### 8.6. 중복 제거 단위 테스트

- [ ] `/Users/kim-yongbin/projects/economic-podcast/tests/unit/news-collector/deduplicator.test.ts` 파일 생성
- [ ] 정확한 중복 제거 테스트 (동일 URL)
- [ ] 유사도 기반 중복 제거 테스트 (90% 이상)
- [ ] 유사도 90% 미만은 유지되는지 테스트
- [ ] 첫 번째 항목 유지 확인 테스트

---

## 9. 메인 뉴스 수집 모듈 통합

### 9.1. 메인 모듈 인덱스 파일 생성

- [ ] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/index.ts` 파일 생성

- [ ] 모든 수집기 임포트:
  ```typescript
  import { RSSCollector } from './rss-collector';
  import { GoogleNewsCollector } from './google-news-collector';
  import { WebCrawler } from './web-crawler';
  import { NewsDeduplicator } from './deduplicator';
  import { NewsItem, NewsCollectorConfig } from './types';
  import { getTodayNewsRange } from '../../utils/date-time';
  import { isValidNewsItem } from '../../utils/validation';
  ```

### 9.2. NewsCollector 메인 클래스 구현

- [ ] 메인 클래스 구조:

  ```typescript
  /**
   * 뉴스 수집 메인 클래스
   * FR-001: 뉴스 수집 모듈
   */
  export class NewsCollector {
    private rssCollector: RSSCollector;
    private googleNewsCollector: GoogleNewsCollector;
    private webCrawler: WebCrawler;
    private deduplicator: NewsDeduplicator;
    private minNewsCount: number;

    constructor(minNewsCount: number = 20) {
      this.rssCollector = new RSSCollector();
      this.googleNewsCollector = new GoogleNewsCollector();
      this.webCrawler = new WebCrawler();
      this.deduplicator = new NewsDeduplicator(0.9); // FR-001-05
      this.minNewsCount = minNewsCount;
    }

    async collectDailyNews(): Promise<NewsItem[]> {
      // 구현 예정
    }
  }
  ```

### 9.3. 일일 뉴스 수집 메인 로직 구현 (FR-001-01)

- [ ] `collectDailyNews` 메서드 구현:

  ```typescript
  /**
   * 일일 뉴스 수집 (0시~22시)
   * FR-001-01: 당일 0시~22시 사이 뉴스 수집
   * FR-001-02: 최소 3개 소스에서 수집
   */
  async collectDailyNews(): Promise<NewsItem[]> {
    console.log('=== 일일 뉴스 수집 시작 ===');
    const startTime = Date.now();

    // 1. 오늘 날짜 범위 가져오기 (0시~22시)
    const { start, end } = getTodayNewsRange();
    console.log(`수집 범위: ${start.toISOString()} ~ ${end.toISOString()}`);

    // 2. 모든 소스에서 병렬로 뉴스 수집
    const results = await Promise.allSettled([
      this.rssCollector.collectNews(start, end),
      this.googleNewsCollector.collectNews(start, end),
      this.webCrawler.collectNews(start, end),
    ]);

    // 3. 결과 통합
    const allNews: NewsItem[] = [];
    results.forEach((result, index) => {
      const sourceName = ['RSS', 'Google News', 'Web Crawl'][index];
      if (result.status === 'fulfilled' && result.value.success) {
        console.log(`${sourceName}: ${result.value.newsItems.length}개 수집`);
        allNews.push(...result.value.newsItems);
      } else if (result.status === 'rejected') {
        console.error(`${sourceName} 수집 실패:`, result.reason);
      }
    });

    console.log(`총 수집된 뉴스: ${allNews.length}개`);

    // 4. 유효성 검증 (FR-001-03)
    const validNews = allNews.filter(isValidNewsItem);
    console.log(`유효한 뉴스: ${validNews.length}개`);

    // 5. 중복 제거 (FR-001-05)
    const deduplicatedNews = this.deduplicator.removeDuplicates(validNews);

    // 6. 최소 개수 검증
    if (deduplicatedNews.length < this.minNewsCount) {
      throw new Error(
        `수집된 뉴스 부족: ${deduplicatedNews.length}개 (최소 ${this.minNewsCount}개 필요)`
      );
    }

    // 7. 최신순 정렬
    deduplicatedNews.sort((a, b) =>
      b.publishedAt.getTime() - a.publishedAt.getTime()
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`=== 뉴스 수집 완료: ${deduplicatedNews.length}개 (${duration}초) ===`);

    return deduplicatedNews;
  }
  ```

### 9.4. 모듈 내보내기

- [ ] 공개 API 내보내기:
  ```typescript
  // 공개 API 내보내기
  export { NewsItem, NewsCollectorConfig, CollectionResult } from './types';
  export { NewsCollector };
  ```

---

## 10. 로깅 통합

### 10.1. 로거 모듈 확인 또는 생성

- [ ] `/Users/kim-yongbin/projects/economic-podcast/src/modules/logger/index.ts` 파일 확인
- [ ] 없으면 기본 로거 생성 또는 winston 설정

- [ ] winston 패키지 설치:
  ```bash
  pnpm add winston
  ```

### 10.2. 로거 설정 (PRD FR-007)

- [ ] 로거 기본 설정:

  ```typescript
  import winston from 'winston';

  export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
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

### 10.3. 뉴스 수집 모듈에 로깅 통합 (FR-007-01, FR-007-02)

- [ ] console.log를 logger로 교체:

  ```typescript
  import { logger } from '../logger';

  // 예시
  logger.info('뉴스 수집 시작', { startTime, endTime });
  logger.error('RSS 수집 실패', { error, feed });
  logger.warn('수집된 뉴스 부족', { count: newsItems.length });
  ```

- [ ] 각 모듈에 로깅 추가:
  - [ ] RSSCollector: 수집 시작/종료, 에러 로그
  - [ ] GoogleNewsCollector: 수집 시작/종료, 에러 로그
  - [ ] WebCrawler: 수집 시작/종료, 에러 로그
  - [ ] NewsDeduplicator: 중복 제거 통계 로그
  - [ ] NewsCollector: 전체 프로세스 로그

### 10.4. 로깅 테스트

- [ ] 로그 파일 생성 확인 (`logs/combined.log`, `logs/error.log`)
- [ ] 로그 포맷 확인 (타임스탬프, 레벨, 메시지)
- [ ] 에러 로그 별도 파일 저장 확인

---

## 11. 설정 관리

### 11.1. 상수 설정 파일 생성

- [ ] `/Users/kim-yongbin/projects/economic-podcast/src/config/constants.ts` 파일 생성

### 11.2. 뉴스 수집 관련 상수 정의

- [ ] 설정 상수 정의:
  ```typescript
  /**
   * 뉴스 수집 모듈 설정
   * PRD 섹션 5.1 참조
   */
  export const NEWS_COLLECTOR_CONFIG = {
    MIN_NEWS_COUNT: 20, // FR-001 Acceptance Criteria
    SIMILARITY_THRESHOLD: 0.9, // FR-001-05: 90% 유사도
    REQUEST_TIMEOUT: 30000, // PRD TR-004-03: 30초
    RETRY_ATTEMPTS: 3, // PRD TR-004-02: 3회 재시도
    RETRY_DELAY: 1000, // 1초
    CRAWL_DELAY: 2000, // 크롤링 딜레이 2초
  };
  ```

### 11.3. RSS 피드 URL 설정

- [ ] RSS 피드 URL 배열 정의:
  ```typescript
  export const RSS_FEEDS = [
    { name: '한국경제', url: 'https://www.hankyung.com/feed/economy' },
    { name: '매일경제', url: 'https://www.mk.co.kr/rss/30100041/' },
    { name: '서울경제', url: 'https://www.sedaily.com/RSS/S1N1.xml' },
    { name: '연합뉴스 경제', url: 'https://www.yonhapnews.co.kr/rss/economy.xml' },
  ];
  ```

### 11.4. Google News 키워드 설정

- [ ] 검색 키워드 배열 정의:
  ```typescript
  export const GOOGLE_NEWS_KEYWORDS = ['한국경제', '금융시장', '주식시장', '환율', '부동산시장', '금리', '코스피'];
  ```

### 11.5. 모듈에서 설정 사용

- [ ] RSS Collector에서 RSS_FEEDS 임포트 및 사용
- [ ] Google News Collector에서 GOOGLE_NEWS_KEYWORDS 임포트 및 사용
- [ ] Deduplicator에서 SIMILARITY_THRESHOLD 임포트 및 사용
- [ ] 하드코딩된 값들을 상수로 교체

---

## 12. 에러 처리 및 재시도 로직

### 12.1. 재시도 유틸리티 생성 (PRD TR-004-02)

- [ ] `/Users/kim-yongbin/projects/economic-podcast/src/utils/retry.ts` 파일 생성

- [ ] exponential backoff 재시도 함수 구현:

  ```typescript
  /**
   * Exponential backoff 재시도 로직
   * PRD TR-004-02: exponential backoff 재시도
   */
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

### 12.2. 재시도 로직 테스트

- [ ] `/Users/kim-yongbin/projects/economic-podcast/tests/unit/utils/retry.test.ts` 생성
- [ ] 성공 시나리오 테스트
- [ ] 재시도 후 성공 테스트
- [ ] 최대 재시도 초과 시 에러 테스트
- [ ] exponential backoff 딜레이 테스트

### 12.3. 수집기에 재시도 로직 적용

- [ ] RSSCollector의 RSS 피드 요청에 재시도 적용
- [ ] GoogleNewsCollector의 검색 요청에 재시도 적용
- [ ] WebCrawler의 페이지 요청에 재시도 적용

### 12.4. 타임아웃 설정 (PRD TR-004-03)

- [ ] 모든 axios 요청에 30초 타임아웃 설정 확인
- [ ] RSS parser에 타임아웃 설정 확인

### 12.5. 에러 로깅 강화 (PRD TR-004-04)

- [ ] 에러 발생 시 상세 컨텍스트 로깅:
  - [ ] 에러 메시지
  - [ ] 스택 트레이스
  - [ ] 요청 URL 또는 소스명
  - [ ] 재시도 횟수
  - [ ] 타임스탬프

---

## 13. 단위 테스트 작성

### 13.1. 테스트 환경 설정

- [ ] Jest 또는 Vitest 설정 확인
- [ ] 테스트 스크립트 `package.json`에 추가:
  ```json
  {
    "scripts": {
      "test": "jest",
      "test:watch": "jest --watch",
      "test:coverage": "jest --coverage"
    }
  }
  ```

### 13.2. 유틸리티 함수 테스트

#### 날짜/시간 유틸리티 테스트

- [ ] `/Users/kim-yongbin/projects/economic-podcast/tests/unit/utils/date-time.test.ts` 생성
- [ ] `getKSTDate()` 테스트
- [ ] `getTodayNewsRange()` 테스트 (0시, 22시 경계값)
- [ ] `isWithinRange()` 테스트

#### 유사도 유틸리티 테스트

- [ ] `/Users/kim-yongbin/projects/economic-podcast/tests/unit/utils/similarity.test.ts` 생성
- [ ] `calculateSimilarity()` 테스트
- [ ] `normalizeText()` 테스트
- [ ] `isDuplicate()` 테스트 (90% 임계값)

#### 검증 유틸리티 테스트

- [ ] `/Users/kim-yongbin/projects/economic-podcast/tests/unit/utils/validation.test.ts` 생성
- [ ] `isValidUrl()` 테스트
- [ ] `isValidNewsItem()` 테스트 (FR-001-03 필수 필드)

### 13.3. RSS Collector 테스트

- [ ] `/Users/kim-yongbin/projects/economic-podcast/tests/unit/news-collector/rss-collector.test.ts` 생성
- [ ] Mock RSS 피드 데이터 작성
- [ ] RSS 파싱 성공 테스트
- [ ] 시간 필터링 테스트
- [ ] 잘못된 RSS 피드 처리 테스트
- [ ] 필수 필드 누락 시 처리 테스트

### 13.4. Google News Collector 테스트

- [ ] `/Users/kim-yongbin/projects/economic-podcast/tests/unit/news-collector/google-news-collector.test.ts` 생성
- [ ] 검색 URL 생성 테스트
- [ ] Google News RSS 파싱 테스트
- [ ] 언론사명 추출 테스트
- [ ] URL 중복 제거 테스트

### 13.5. Web Crawler 테스트

- [ ] `/Users/kim-yongbin/projects/economic-podcast/tests/unit/news-collector/web-crawler.test.ts` 생성
- [ ] HTML 파싱 테스트 (샘플 HTML 사용)
- [ ] 날짜 파싱 테스트 (다양한 형식)
- [ ] URL 해석 테스트
- [ ] 선택자 누락 처리 테스트

### 13.6. Deduplicator 테스트

- [ ] `/Users/kim-yongbin/projects/economic-podcast/tests/unit/news-collector/deduplicator.test.ts` 생성
- [ ] URL 기반 중복 제거 테스트
- [ ] 유사도 기반 중복 제거 테스트 (90% 임계값)
- [ ] 89% 유사도는 유지되는지 테스트
- [ ] 빈 배열 처리 테스트

### 13.7. NewsCollector 메인 클래스 테스트

- [ ] `/Users/kim-yongbin/projects/economic-podcast/tests/unit/news-collector/news-collector.test.ts` 생성
- [ ] `collectDailyNews()` 메서드 테스트 (Mock 사용)
- [ ] 최소 개수 미달 시 에러 테스트
- [ ] 유효성 검증 테스트

---

## 14. 통합 테스트 작성

### 14.1. 통합 테스트 파일 생성

- [ ] `/Users/kim-yongbin/projects/economic-podcast/tests/integration/news-collector.test.ts` 파일 생성

### 14.2. 전체 파이프라인 통합 테스트

- [ ] 실제 뉴스 수집 end-to-end 테스트:

  ```typescript
  describe('NewsCollector 통합 테스트', () => {
    it('실제 소스에서 뉴스 수집 및 처리', async () => {
      const collector = new NewsCollector();
      const news = await collector.collectDailyNews();

      // 최소 개수 확인 (FR-001 Acceptance Criteria)
      expect(news.length).toBeGreaterThanOrEqual(20);

      // 모든 뉴스 필수 필드 확인 (FR-001-03)
      news.forEach((item) => {
        expect(item.title).toBeTruthy();
        expect(item.summary).toBeTruthy();
        expect(item.url).toBeTruthy();
        expect(item.publishedAt).toBeInstanceOf(Date);
        expect(item.source).toBeTruthy();
      });

      // 중복 없음 확인 (FR-001-05)
      const urls = news.map((n) => n.url);
      const uniqueUrls = new Set(urls);
      expect(urls.length).toBe(uniqueUrls.size);
    }, 30000); // 타임아웃 30초
  });
  ```

### 14.3. 개별 소스 통합 테스트

- [ ] RSS Collector 실제 피드 테스트
- [ ] Google News Collector 실제 검색 테스트
- [ ] Web Crawler 실제 크롤링 테스트

### 14.4. 에러 시나리오 통합 테스트

- [ ] 네트워크 에러 시뮬레이션
- [ ] 일부 소스 실패 시 계속 진행 확인
- [ ] 타임아웃 처리 확인

---

## 15. 수용 기준 검증

### 15.1. FR-001-01 검증: 시간 범위 필터링

**Given:** 22:00에 스케줄러가 실행되었을 때
**When:** 뉴스 수집 모듈이 실행되면
**Then:** 당일 0시~22시 사이 뉴스만 수집

- [ ] 테스트 케이스 작성: 수집된 모든 뉴스의 `publishedAt`이 당일 0시~22시 범위인지 확인
- [ ] 전일 뉴스가 제외되는지 확인
- [ ] KST 시간대 올바르게 처리되는지 확인

### 15.2. FR-001-02 검증: 다중 소스 지원

**Then:** 최소 3개 이상의 뉴스 소스가 구현됨

- [ ] RSS 피드 수집기 동작 확인
- [ ] Google News 수집기 동작 확인
- [ ] 웹 크롤러 동작 확인
- [ ] 각 소스에서 뉴스 수집되는지 확인

### 15.3. FR-001-03 검증: 필수 필드 포함

**Then:** 모든 뉴스 항목은 필수 필드를 포함해야 함

- [ ] 테스트: 모든 뉴스의 `title` 필드 존재 및 비어있지 않음
- [ ] 테스트: 모든 뉴스의 `summary` 필드 존재 및 비어있지 않음
- [ ] 테스트: 모든 뉴스의 `url` 필드 유효한 URL 형식
- [ ] 테스트: 모든 뉴스의 `publishedAt` 필드 유효한 Date 객체
- [ ] 테스트: 모든 뉴스의 `source` 필드 존재 및 비어있지 않음
- [ ] 테스트: `category` 필드 선택적 처리

### 15.4. FR-001-04 검증: 날짜 필터링

**Then:** 발행 시간 기준으로 필터링됨

- [ ] 테스트: startTime 이전 뉴스 제외
- [ ] 테스트: endTime 이후 뉴스 제외
- [ ] 테스트: 경계값 (정확히 0시, 22시) 포함
- [ ] 테스트: 시간대(KST) 올바르게 처리

### 15.5. FR-001-05 검증: 중복 제거

**Then:** 중복 기사는 제거되어야 함

- [ ] 테스트: 동일 제목 뉴스 중복 제거
- [ ] 테스트: 90% 이상 유사 제목 중복 제거
- [ ] 테스트: 89% 유사 제목은 유지
- [ ] 테스트: 중복 제거 개수 로깅 확인
- [ ] 테스트: 첫 번째 항목 유지 확인

### 15.6. Acceptance Criteria 검증: 최소 뉴스 개수

**Then:** 최소 20개 이상의 유효한 경제 뉴스가 수집되어야 함

- [ ] 통합 테스트: 실제 환경에서 20개 이상 수집 확인
- [ ] 테스트: 20개 미만 시 에러 발생 확인
- [ ] 문서화: 최소 개수 미달 시 대응 방안

### 15.7. Acceptance Criteria 검증: 로그 기록

**And:** 수집 완료 로그가 기록되어야 함

- [ ] 로그 파일 생성 확인
- [ ] 수집 시작 로그 확인
- [ ] 수집 완료 로그 확인 (개수 포함)
- [ ] 소스별 수집 개수 로그 확인
- [ ] 에러 발생 시 에러 로그 확인

---

## 16. 성능 최적화

### 16.1. 성능 측정 (PRD NFR-PERF-01)

- [ ] 각 수집 단계별 시간 측정 추가:

  ```typescript
  const startTime = Date.now();
  // ... 수집 로직
  const duration = Date.now() - startTime;
  logger.info(`RSS 수집 완료 (${duration}ms)`);
  ```

- [ ] 전체 프로세스 시간 측정
- [ ] 목표: 5초 이내 완료 (NFR-PERF-01)

### 16.2. 병렬 처리 최적화

- [ ] `Promise.all()` 또는 `Promise.allSettled()` 사용 확인
- [ ] 모든 소스 동시 수집 확인
- [ ] 개별 소스 실패가 전체 프로세스 중단하지 않는지 확인

### 16.3. 중복 제거 성능 최적화

- [ ] URL 기반 중복 제거 먼저 수행 (O(n))
- [ ] 유사도 계산은 URL 중복 제거 후 수행
- [ ] 대량 데이터(100개 이상) 처리 성능 테스트

### 16.4. 메모리 최적화

- [ ] 불필요한 데이터 즉시 해제
- [ ] 대용량 HTML 파싱 후 메모리 정리
- [ ] 메모리 누수 확인

---

## 17. 문서화

### 17.1. 코드 문서화 (PRD NFR-MAIN-02)

- [ ] 모든 공개 함수/클래스에 JSDoc 주석 추가:

  ```typescript
  /**
   * 일일 한국 경제 뉴스 수집
   *
   * @returns {Promise<NewsItem[]>} 수집된 뉴스 배열
   * @throws {Error} 최소 뉴스 개수(20개) 미달 시
   *
   * @example
   * const collector = new NewsCollector();
   * const news = await collector.collectDailyNews();
   * console.log(`수집된 뉴스: ${news.length}개`);
   */
  async collectDailyNews(): Promise<NewsItem[]>
  ```

- [ ] 각 필드에 주석 추가
- [ ] 복잡한 로직에 설명 주석 추가

### 17.2. API 문서 작성

- [ ] `/Users/kim-yongbin/projects/economic-podcast/docs/api/news-collector.md` 파일 생성

- [ ] NewsCollector 클래스 문서:
  - [ ] 생성자 파라미터
  - [ ] 공개 메서드
  - [ ] 반환 타입
  - [ ] 에러 시나리오

- [ ] 데이터 구조 문서:
  - [ ] NewsItem 인터페이스
  - [ ] CollectionResult 인터페이스
  - [ ] 설정 인터페이스

### 17.3. 사용 예시 문서

- [ ] README 또는 별도 문서에 사용 예시 추가:

  ```typescript
  // 기본 사용
  import { NewsCollector } from './modules/news-collector';

  const collector = new NewsCollector();
  const news = await collector.collectDailyNews();
  console.log(`수집된 뉴스: ${news.length}개`);

  // 커스텀 설정
  const customCollector = new NewsCollector(30); // 최소 30개
  const moreNews = await customCollector.collectDailyNews();
  ```

### 17.4. 에러 코드 문서 (PRD 부록 14.2)

- [ ] 에러 코드 정의 문서 작성:
  - [ ] `ERR_NEWS_001`: 뉴스 수집 실패
  - [ ] `ERR_NEWS_002`: 수집된 뉴스 부족 (20개 미만)
  - [ ] 각 에러의 복구 방법

---

## 18. 코드 리뷰 및 정리

### 18.1. 코드 품질 검사

- [ ] ESLint 실행 및 모든 에러 수정:

  ```bash
  pnpm run lint
  ```

- [ ] Prettier로 코드 포맷팅:

  ```bash
  pnpm run format
  ```

- [ ] 주석 처리된 코드 제거
- [ ] 디버그용 console.log 제거 (logger 사용)
- [ ] 일관된 코드 스타일 확인

### 18.2. 타입 안전성 검사

- [ ] `any` 타입 사용 제거 또는 최소화
- [ ] 모든 함수 파라미터 타입 명시
- [ ] 모든 함수 반환 타입 명시
- [ ] TypeScript strict 모드 컴파일 확인:
  ```bash
  npx tsc --noEmit --strict
  ```

### 18.3. 보안 검토

- [ ] API 키나 민감 정보 하드코딩 없음 확인
- [ ] 환경 변수로 모든 설정 관리 확인
- [ ] URL 검증으로 SSRF 방지 확인
- [ ] 사용자 입력 검증 (해당되는 경우)

### 18.4. 의존성 검토

- [ ] 불필요한 의존성 제거
- [ ] `package.json` 정리
- [ ] 의존성 취약점 검사:
  ```bash
  pnpm audit
  ```

---

## 19. 최종 검증 및 배포 준비

### 19.1. 테스트 커버리지 확인 (PRD NFR-MAIN-01)

- [ ] 테스트 커버리지 리포트 생성:

  ```bash
  pnpm test -- --coverage
  ```

- [ ] 커버리지 70% 이상 확인
- [ ] 미테스트 코드 경로 확인 및 테스트 추가

### 19.2. 전체 테스트 실행

- [ ] 모든 단위 테스트 실행:

  ```bash
  pnpm test tests/unit/
  ```

- [ ] 모든 통합 테스트 실행:

  ```bash
  pnpm test tests/integration/
  ```

- [ ] 모든 테스트 통과 확인
- [ ] 실패 테스트 수정

### 19.3. 수동 검증

- [ ] 테스트 스크립트 작성 및 실행:

  ```typescript
  // test-collector-manual.ts
  import { NewsCollector } from './modules/news-collector';

  async function test() {
    const collector = new NewsCollector();
    const news = await collector.collectDailyNews();

    console.log(`총 ${news.length}개 뉴스 수집`);
    console.log('샘플 뉴스:', news[0]);
  }

  test();
  ```

- [ ] 실행 및 출력 확인:
  - [ ] 뉴스 개수 >= 20
  - [ ] 모든 필수 필드 존재
  - [ ] 날짜가 오늘 범위 내
  - [ ] 다양한 소스 (RSS, Google News, 크롤링)

### 19.4. 환경 변수 문서화

- [ ] `.env.example` 업데이트
- [ ] 필요한 모든 환경 변수 문서화
- [ ] 기본값 명시

### 19.5. Git 커밋 및 PR 준비

- [ ] feature 브랜치 생성:

  ```bash
  git checkout -b feature/fr-001-news-collector
  ```

- [ ] 의미 있는 커밋 메시지로 커밋:

  ```bash
  git commit -m "feat(news-collector): RSS 피드 수집기 구현"
  git commit -m "feat(news-collector): Google News 수집기 구현"
  git commit -m "feat(news-collector): 웹 크롤러 구현"
  git commit -m "feat(news-collector): 중복 제거 로직 구현"
  git commit -m "test(news-collector): 단위 및 통합 테스트 추가"
  git commit -m "docs(news-collector): API 문서 작성"
  ```

- [ ] Pull Request 생성
- [ ] PR 설명에 다음 포함:
  - [ ] 구현된 기능 요약
  - [ ] PRD 섹션 참조 (5.1, 8.1)
  - [ ] 테스트 결과
  - [ ] 스크린샷 또는 로그 예시

---

## 20. 모듈 완료 체크리스트

### 20.1. 기능 요구사항 완료 확인

- [ ] **FR-001-01**: 당일 0시~22시 뉴스 수집 구현 및 테스트 완료
- [ ] **FR-001-02**: 3개 이상 뉴스 소스 구현 (RSS, Google News, 웹 크롤링)
- [ ] **FR-001-03**: 모든 필수 필드 추출 및 검증 구현
- [ ] **FR-001-04**: 날짜 기반 필터링 구현 및 테스트 완료
- [ ] **FR-001-05**: 중복 제거 (90% 유사도) 구현 및 테스트 완료

### 20.2. Acceptance Criteria 완료 확인

- [ ] 최소 20개 뉴스 수집 (통합 테스트로 검증)
- [ ] 모든 뉴스 필수 필드 포함 (검증 로직 구현)
- [ ] 중복 제거 (90% 임계값 적용)
- [ ] 수집 완료 로그 기록 (winston 통합)

### 20.3. 기술 요구사항 완료 확인

- [ ] TypeScript로 구현 (strict 모드)
- [ ] ESLint 및 Prettier 설정 및 통과
- [ ] 모든 의존성 설치 및 문서화
- [ ] 환경 변수로 설정 관리
- [ ] 재시도 로직 (exponential backoff) 구현
- [ ] 모든 외부 호출 타임아웃 30초 설정
- [ ] 상세 에러 로깅 구현

### 20.4. 테스트 요구사항 완료 확인

- [ ] 모든 주요 함수 단위 테스트 작성
- [ ] End-to-end 통합 테스트 작성
- [ ] 테스트 커버리지 >= 70%
- [ ] 모든 테스트 통과
- [ ] 수동 테스트 완료

### 20.5. 문서화 요구사항 완료 확인

- [ ] 모든 공개 API JSDoc 주석 작성
- [ ] API 문서 작성
- [ ] 사용 예시 문서 작성
- [ ] README 업데이트
- [ ] 에러 코드 문서화

### 20.6. 성능 요구사항 완료 확인

- [ ] 수집 완료 시간 < 5초 (NFR-PERF-01)
- [ ] 메모리 누수 없음
- [ ] 병렬 처리 구현
- [ ] 효율적인 중복 제거 알고리즘

---

## 완료 서명

**모듈:** FR-001 뉴스 수집 모듈
**상태:** [ ] 완료 / [ ] 진행 중 / [ ] 시작 전

**구현 완료자:** **\*\***\_\_\_**\*\***
**완료 날짜:** **\*\***\_\_\_**\*\***
**검토자:** **\*\***\_\_\_**\*\***
**검토 날짜:** **\*\***\_\_\_**\*\***

---

## 다음 단계

FR-001 완료 후 다음 단계로 진행:

1. **FR-002: 이슈 추출 및 선정 모듈** 구현 (NewsItem[] 입력 사용)
2. **FR-006: 스케줄링 및 자동화 모듈**과 통합
3. End-to-end 테스트 (전체 파이프라인)

---

## 이슈 및 메모

구현 중 발생한 이슈, 블로커, 중요 메모 기록:

```
[날짜] [이슈/메모]
-
```

---

**최종 업데이트:** 2025-12-19
**문서 버전:** 1.0
**작성자:** 개발팀
