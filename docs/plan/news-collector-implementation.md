# News Collector Implementation Plan (FR-001)

**Document Version:** 2.0
**Last Updated:** 2026-01-05
**Status:** In Progress
**PRD Reference:** FR-001 (뉴스 수집 및 필터링 모듈)

---

## Overview

This document outlines the implementation plan for **FR-001: News Collection & Filtering Module**, aligned with the updated PRD's "초자극형 필터링" strategy.

### Key Requirements from PRD

- **32 Keyword Strategy:** Layer 1 (내 지갑), Layer 2 (회사), Layer 3 (글로벌)
- **2-Stage Gemini Pipeline:** 100→15 (제목) → 3-5 (본문)
- **60-Second Total Completion:** RSS (10s) + Gemini Title (2s) + Playwright (45s) + Noise Removal (0.1s) + Gemini Body (3s)
- **11 Noise Removal Patterns:** 광고, 페이월, 저작권 등

### Updated Architecture

```
src/modules/news-collector/
├── google-news/
│   ├── collector.ts         # RSS 수집 (32 keywords, 100 articles)
│   ├── extractor.ts         # Playwright 본문 추출 (15 articles only)
│   └── __test__/
├── naver-news/
│   ├── collector.ts         # 네이버 API/크롤링
│   └── extractor.ts         # 네이버 본문 추출
├── shared/
│   ├── playwright-manager.ts    # 브라우저 풀 관리
│   ├── cheerio-utils.ts         # 공통 파싱 유틸
│   ├── noise-remover.ts         # ⭐ NEW: 11가지 노이즈 제거
│   └── gemini-filter.ts         # ⭐ NEW: 2단계 필터링
├── rss-collector.ts         # 범용 RSS (deprecated for Google News)
├── deduplicator.ts          # 중복 제거
├── index.ts                 # 메인 NewsCollector 통합
└── types.ts                 # 공통 타입
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2) ✅ COMPLETED

#### 7. 디렉토리 구조 재구성 (사이트별 독립 구조) ✅

**구현 완료**

**⚠️ 아키텍처 변경**: 기존 flat 구조에서 **사이트별 독립 구조 (Option B)**로 전환합니다.

**변경 이유:**

- Google News RSS와 Naver API는 기사 **링크만** 제공 (본문 제공 안 함)
- 각 링크의 본문을 크롤링하려면 **사이트별 최적화된 Extractor** 필요
- 동적 콘텐츠("더보기" 버튼 등)는 Playwright, 정적 페이지는 Cheerio 사용
- 사이트별 독립 구조 = 유지보수성 향상, 변경 영향 최소화

##### 7.1. 새로운 디렉토리 구조 생성

- [x] 사이트별 디렉토리 생성:
  ```bash
  mkdir -p src/modules/news-collector/google-news
  mkdir -p src/modules/news-collector/naver-news
  mkdir -p src/modules/news-collector/shared
  ```

##### 7.2. 기존 파일 이동 및 재구성

- [x] 기존 `google-news-collector.ts` 파일을 `google-news/collector.ts`로 이동
- [x] `rss-collector.ts`는 그대로 유지 (RSS는 범용이므로 최상위 유지)

##### 7.3. Playwright 패키지 설치

- [x] Playwright 설치 및 타입 정의 확인

##### 7.4. 아키텍처 개요 문서화

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

#### 8. Shared Utilities 구현 ✅

##### 8.1. Playwright Manager 구현 (FR-001-04)

- [x] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/shared/playwright-manager.ts` 파일 생성
- [x] Playwright Manager 클래스 구현 (브라우저 재사용, 동시 요청 수 제한)

##### 8.2. Cheerio Utilities 구현

- [x] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/shared/cheerio-utils.ts` 파일 생성
- [x] 공통 파싱 유틸리티 함수 구현

##### 8.3. Shared Utilities 테스트

- [x] Playwright Manager 테스트 완료
- [x] Cheerio Utils 테스트 완료

---

#### 9. Google News Extractor 구현 (FR-001-03, FR-001-04) ✅

##### 9.1. Google News Extractor 파일 생성

- [x] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/google-news/extractor.ts` 파일 생성

##### 9.2. Extractor 클래스 구현

- [x] 기본 구조 작성 (Playwright 기반 본문 추출)

##### 9.3. Google News Collector와 Extractor 통합

- [x] `google-news/collector.ts` 수정하여 Extractor 호출 추가
- [x] **추가 구현**: `google-news/service.ts` 생성 (Service 레이어 패턴)

##### 9.4. Google News Extractor 테스트

- [x] ✅ **완료**: 테스트 파일 생성 완료
- [x] 단일 기사 본문 추출 테스트 (구조 검증)
- [x] 여러 기사 일괄 처리 테스트 (구조 검증)
- [x] 추출 실패 시 원본 반환 테스트 (구조 검증)
- [x] Rate limiting 테스트 (구조 검증)
- [x] FR-001-03: 기사 본문 필수 필드 추출 검증
- [x] FR-001-04: 동적 콘텐츠 지원 검증
- [x] 빈 배열 처리 테스트

---

### Phase 2: Core Filtering Pipeline (Week 3-4) ⚠️ IN PROGRESS

This phase implements the PRD's **2-stage Gemini filtering strategy** with 32 keywords and noise removal.

---

#### 10. 32 Keyword Configuration (Layer 1/2/3)

**우선순위:** P0 (필수)
**목표 시간:** RSS 수집 10초 내 100개 기사 수집

**PRD Reference:**

- Step 1: RSS 수집 (10초) - 32개 키워드 (내 지갑, 회사, 글로벌)

##### 10.1. Keyword Strategy 파일 생성

- [x] `/Users/kim-yongbin/projects/economic-podcast/src/config/keywords.ts` 파일 생성

- [x] 32개 키워드 정의 (3단계 계층 구조):

  ```typescript
  export const ECONOMIC_KEYWORDS = {
    // Layer 1: 내 지갑 직접 타격 (10개)
    layer1_wallet: [
      '월급',
      '연봉',
      '퇴직금',
      '소득세',
      '건강보험료',
      '최저시급',
      '유류세',
      '전기요금',
      '통신비',
      '대출금리',
    ],

    // Layer 2: 회사/직장 트렌드 (12개)
    layer2_company: [
      '채용',
      '구조조정',
      '워라밸',
      '재택근무',
      '육아휴직',
      '연차',
      '4대보험',
      '스톡옵션',
      '실업급여',
      '주 52시간',
      '취업',
      '이직',
    ],

    // Layer 3: 글로벌/거시경제 (10개)
    layer3_global: ['금리', '환율', '주식', '부동산', '인플레이션', '유가', '반도체', '전기차', '미중무역', 'AI산업'],
  };

  // 전체 32개 키워드 배열
  export const ALL_KEYWORDS = [
    ...ECONOMIC_KEYWORDS.layer1_wallet,
    ...ECONOMIC_KEYWORDS.layer2_company,
    ...ECONOMIC_KEYWORDS.layer3_global,
  ];
  ```

##### 10.2. Google News Collector 키워드 적용

- [x] `google-news/collector.ts` 수정:
  - 기존 하드코딩된 키워드 제거
  - `ALL_KEYWORDS` import 및 적용
  - 키워드별 병렬 수집 최적화 (10초 목표)

- [x] 성능 최적화:
  - Promise.allSettled로 병렬 RSS 요청
  - 타임아웃 설정 (각 키워드당 최대 3초)
  - 실패한 키워드는 무시하고 계속 진행

##### 10.3. Keywords 테스트

- [x] `/Users/kim-yongbin/projects/economic-podcast/src/config/__test__/keywords.unit.test.ts` 생성
- [x] 32개 키워드 개수 검증
- [x] 중복 키워드 없음 검증
- [x] Layer별 키워드 분류 검증

---

#### 11. Gemini Filter 모듈 구현 (2-Stage Pipeline)

**우선순위:** P0 (필수)
**목표 시간:** 제목 필터링 2초 + 본문 필터링 3초 = 5초

**PRD Reference:**

- Step 2A: Gemini 제목 필터링 (2초) - 100개 → 15개
- Step 3: Gemini 본문 필터링 (3초) - 15개 → 3-5개

##### 11.1. Gemini Filter 파일 생성

- [x] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/shared/gemini-filter.ts` 파일 생성

- [x] 타입 정의 추가 (`types.ts`):

  ```typescript
  export interface FilteredNews {
    newsItems: NewsItem[];
    filterStage: 'title' | 'body';
    originalCount: number;
    filteredCount: number;
    filterReason?: string; // 왜 선택되었는지
  }

  export interface GeminiFilterConfig {
    stage: 'title' | 'body';
    targetCount: number; // 15 for title, 3-5 for body
    timeout: number; // 2000ms for title, 3000ms for body
  }
  ```

##### 11.2. Stage 1: Title Filter 구현 (100→15)

- [x] `GeminiTitleFilter` 클래스 구현:

  ```typescript
  import { GoogleGenerativeAI } from '@google/generative-ai';
  import { NewsItem, FilteredNews } from '../types.js';

  export class GeminiTitleFilter {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    }

    async filterByTitle(newsItems: NewsItem[]): Promise<FilteredNews> {
      const startTime = Date.now();

      // Prompt: "The Hook Test" - 3초 안에 스크롤 멈추게 할 제목 15개 선별
      const prompt = this.buildTitleFilterPrompt(newsItems);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const selectedIndices = this.parseGeminiResponse(response.text());

      const filtered = selectedIndices.map((idx) => newsItems[idx]);

      const duration = Date.now() - startTime;
      console.log(`Gemini Title Filter: ${newsItems.length}→${filtered.length} in ${duration}ms`);

      return {
        newsItems: filtered,
        filterStage: 'title',
        originalCount: newsItems.length,
        filteredCount: filtered.length,
      };
    }

    private buildTitleFilterPrompt(newsItems: NewsItem[]): string {
      return `
        당신은 밤 11시, 침대에서 쇼츠를 넘기는 25-40대 직장인의 뇌를 해킹하는 경제 콘텐츠 PD입니다.
  
        **The Hook Test:** 아래 100개 뉴스 제목 중, 3초 안에 스크롤을 멈추게 만들 뉴스 15개를 선별하세요.
  
        **선별 기준:**
        1. "헐 진짜??" 반응 유도 (충격, 의외성)
        2. "내 지갑" 직접 타격 (월급, 대출, 세금 관련)
        3. "내일 회사에서 얘기할 소재" (화제성)
        4. 구체적 숫자 포함 (%, 원, 명 등)
  
        **뉴스 목록 (제목만):**
        ${newsItems.map((item, idx) => `${idx}. ${item.title}`).join('\n')}
  
        **출력 형식:** JSON 배열 (인덱스만)
        예: [3, 7, 12, 15, 22, 28, 33, 41, 49, 56, 63, 71, 78, 85, 92]
      `;
    }

    private parseGeminiResponse(text: string): number[] {
      // JSON 파싱 로직 (에러 처리 포함)
      try {
        return JSON.parse(text);
      } catch (error) {
        console.error('Gemini response parsing failed:', error);
        // Fallback: 첫 15개 반환
        return Array.from({ length: 15 }, (_, i) => i);
      }
    }
  }
  ```

##### 11.3. Stage 2: Body Filter 구현 (15→3-5)

- [x] `GeminiBodyFilter` 클래스 구현:

  ```typescript
  export class GeminiBodyFilter {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    }

    async filterByBody(newsItems: NewsItem[]): Promise<FilteredNews> {
      const startTime = Date.now();

      // Prompt: "Action Trigger + 45초 Rule + 바이럴 DNA"
      const prompt = this.buildBodyFilterPrompt(newsItems);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const selectedIndices = this.parseGeminiResponse(response.text());

      const filtered = selectedIndices.map((idx) => newsItems[idx]);

      const duration = Date.now() - startTime;
      console.log(`Gemini Body Filter: ${newsItems.length}→${filtered.length} in ${duration}ms`);

      return {
        newsItems: filtered,
        filterStage: 'body',
        originalCount: newsItems.length,
        filteredCount: filtered.length,
      };
    }

    private buildBodyFilterPrompt(newsItems: NewsItem[]): string {
      return `
        당신은 바이럴 쇼츠 PD입니다. 아래 15개 뉴스 중 45초 쇼츠로 만들 최종 3-5개를 선별하세요.
  
        **선별 기준:**
        1. **Action Trigger:** "내일 회사 가서 동료한테 말할까?" (공유 욕구)
        2. **45초 Rule:** 기승전결 구조로 만들 수 있는 스토리
        3. **바이럴 DNA:** 댓글 남기고 싶게 만드는 논쟁거리 또는 팩트
  
        **뉴스 목록 (제목 + 본문 800자):**
        ${newsItems
          .map(
            (item, idx) => `
    ${idx}. ${item.title}
    본문: ${item.content?.substring(0, 800) || item.summary}
  `
          )
          .join('\n---\n')}
  
        **출력 형식:** JSON 배열 (3-5개 인덱스)
        예: [2, 5, 8, 11, 14]
      `;
    }

    private parseGeminiResponse(text: string): number[] {
      try {
        return JSON.parse(text);
      } catch (error) {
        console.error('Gemini response parsing failed:', error);
        // Fallback: 첫 3개 반환
        return [0, 1, 2];
      }
    }
  }
  ```

##### 11.4. Gemini Filter 통합 클래스

- [x] `GeminiFilter` 통합 클래스:

  ```typescript
  export class GeminiFilter {
    private titleFilter: GeminiTitleFilter;
    private bodyFilter: GeminiBodyFilter;

    constructor(apiKey: string) {
      this.titleFilter = new GeminiTitleFilter(apiKey);
      this.bodyFilter = new GeminiBodyFilter(apiKey);
    }

    async filterTitles(newsItems: NewsItem[]): Promise<FilteredNews> {
      return this.titleFilter.filterByTitle(newsItems);
    }

    async filterBodies(newsItems: NewsItem[]): Promise<FilteredNews> {
      return this.bodyFilter.filterByBody(newsItems);
    }
  }
  ```

##### 11.5. Gemini Filter 테스트

- [x] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/shared/__test__/gemini-filter.unit.test.ts` 생성
- [x] Title Filter 테스트 (100→15 개수 검증)
- [x] Body Filter 테스트 (15→3-5 개수 검증)
- [x] 타임아웃 테스트 (2초, 3초 준수)
- [x] Gemini API 실패 시 Fallback 테스트
- [x] JSON 파싱 실패 시 Fallback 테스트

---

#### 12. Noise Removal 모듈 구현 (11 Patterns)

**우선순위:** P0 (필수)
**목표 시간:** 0.1초 (정규식 기반 고속 처리)

**PRD Reference:**

- Step 2C: 노이즈 제거 (0.1초) - 11가지 패턴 제거

##### 12.1. Noise Remover 파일 생성

- [x] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/shared/noise-remover.ts` 파일 생성

- [x] 11가지 노이즈 패턴 정의:

  ```typescript
  export interface NoisePattern {
    name: string;
    pattern: RegExp;
    description: string;
  }

  export const NOISE_PATTERNS: NoisePattern[] = [
    // 1. 광고 문구
    {
      name: 'advertisement',
      pattern: /\[광고\]|\(광고\)|AD|Sponsored/gi,
      description: '광고 표시 제거',
    },

    // 2. 페이월 안내
    {
      name: 'paywall',
      pattern: /유료회원|구독하시면|프리미엄 회원|로그인 후|기사 전문/gi,
      description: '페이월 관련 문구 제거',
    },

    // 3. 저작권 표시
    {
      name: 'copyright',
      pattern: /ⓒ|©|저작권자|무단전재|재배포금지/gi,
      description: '저작권 표시 제거',
    },

    // 4. 기자 정보
    {
      name: 'reporter',
      pattern: /기자\s*=|작성자:|글:\s*\w+/gi,
      description: '기자 정보 제거',
    },

    // 5. 날짜/시간 스탬프
    {
      name: 'timestamp',
      pattern: /\d{4}년\s*\d{1,2}월\s*\d{1,2}일|\d{4}-\d{2}-\d{2}/g,
      description: '날짜 스탬프 제거',
    },

    // 6. HTML 태그 잔여물
    {
      name: 'html_tags',
      pattern: /<[^>]*>|&nbsp;|&lt;|&gt;|&amp;/gi,
      description: 'HTML 태그 제거',
    },

    // 7. 이메일 주소
    {
      name: 'email',
      pattern: /[\w.-]+@[\w.-]+\.\w+/g,
      description: '이메일 주소 제거',
    },

    // 8. SNS 공유 문구
    {
      name: 'social_share',
      pattern: /페이스북|트위터|카카오톡|공유하기|좋아요/gi,
      description: 'SNS 공유 문구 제거',
    },

    // 9. 푸터 정보
    {
      name: 'footer',
      pattern: /관련기사|이 기사|더보기|사진제공|출처:/gi,
      description: '푸터 정보 제거',
    },

    // 10. 과도한 공백
    {
      name: 'whitespace',
      pattern: /\s{2,}/g,
      description: '연속 공백 제거',
    },

    // 11. 특수문자 남용
    {
      name: 'special_chars',
      pattern: /[★☆■□▲▶◆●◇◎]/g,
      description: '특수문자 제거',
    },
  ];
  ```

##### 12.2. NoiseRemover 클래스 구현

- [x] NoiseRemover 클래스:

  ```typescript
  export class NoiseRemover {
    private patterns: NoisePattern[];

    constructor() {
      this.patterns = NOISE_PATTERNS;
    }

    /**
     * 본문에서 노이즈 제거 (800자 정제, 문장 완결성 유지)
     */
    removeNoise(content: string): string {
      const startTime = Date.now();

      let cleaned = content;

      // 1단계: 11가지 패턴 순차 적용
      for (const { name, pattern } of this.patterns) {
        cleaned = cleaned.replace(pattern, '');
      }

      // 2단계: 공백 정규화 (중복 적용)
      cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

      // 3단계: 800자 제한 (문장 완결성 유지)
      cleaned = this.truncateToSentence(cleaned, 800);

      const duration = Date.now() - startTime;
      console.log(`Noise removal: ${content.length}→${cleaned.length} chars in ${duration}ms`);

      return cleaned;
    }

    /**
     * 800자 내에서 마지막 완결 문장까지만 자르기
     */
    private truncateToSentence(text: string, maxLength: number): string {
      if (text.length <= maxLength) {
        return text;
      }

      const truncated = text.substring(0, maxLength);
      const lastPeriod = Math.max(
        truncated.lastIndexOf('.'),
        truncated.lastIndexOf('。'),
        truncated.lastIndexOf('?'),
        truncated.lastIndexOf('!')
      );

      if (lastPeriod > 0) {
        return truncated.substring(0, lastPeriod + 1);
      }

      return truncated;
    }

    /**
     * 여러 뉴스 일괄 처리
     */
    removeNoiseFromItems(newsItems: NewsItem[]): NewsItem[] {
      return newsItems.map((item) => ({
        ...item,
        content: item.content ? this.removeNoise(item.content) : item.content,
        summary: this.removeNoise(item.summary),
      }));
    }
  }
  ```

##### 12.3. Noise Remover 테스트

- [x] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/shared/__test__/noise-remover.unit.test.ts` 생성
- [x] 11가지 패턴 각각 테스트
- [x] 800자 제한 테스트
- [x] 문장 완결성 유지 테스트
- [x] 성능 테스트 (0.1초 이내)
- [x] 빈 문자열 처리 테스트

---

#### 13. Pipeline Integration (60초 완성)

**우선순위:** P0 (필수)
**목표:** RSS (10s) + Title Filter (2s) + Playwright (45s) + Noise Removal (0.1s) + Body Filter (3s) = 60.1초

##### 13.1. Main Collector 파이프라인 수정

- [ ] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/index.ts` 수정

- [ ] 2단계 파이프라인 적용:

  ```typescript
  import { GoogleNewsCollector } from './google-news/collector.js';
  import { GoogleNewsExtractor } from './google-news/extractor.js';
  import { GeminiFilter } from './shared/gemini-filter.js';
  import { NoiseRemover } from './shared/noise-remover.js';
  import { playwrightManager } from './shared/playwright-manager.js';
  import { NewsItem } from './types.js';

  export class NewsCollector {
    private collector: GoogleNewsCollector;
    private extractor: GoogleNewsExtractor;
    private geminiFilter: GeminiFilter;
    private noiseRemover: NoiseRemover;

    constructor(geminiApiKey: string) {
      this.collector = new GoogleNewsCollector();
      this.extractor = new GoogleNewsExtractor();
      this.geminiFilter = new GeminiFilter(geminiApiKey);
      this.noiseRemover = new NoiseRemover();
    }

    /**
     * 2단계 필터링 파이프라인 (60초 완료)
     */
    async collectAndFilter(): Promise<NewsItem[]> {
      console.log('=== 2-Stage Filtering Pipeline Started ===');
      const pipelineStart = Date.now();

      try {
        await playwrightManager.initialize();

        // Step 1: RSS 수집 (10초 목표, 100개)
        console.log('[Step 1] RSS Collection (target: 10s, 100 articles)');
        const step1Start = Date.now();
        const { startOfDay, endOfDay } = getTodayNewsRange();
        const rssResult = await this.collector.collectNews(startOfDay, endOfDay);
        const step1Duration = ((Date.now() - step1Start) / 1000).toFixed(2);
        console.log(`  ✓ Collected ${rssResult.newsItems.length} articles in ${step1Duration}s`);

        // Step 2A: Gemini 제목 필터링 (2초 목표, 100→15)
        console.log('[Step 2A] Gemini Title Filtering (target: 2s, 100→15)');
        const step2aStart = Date.now();
        const titleFiltered = await this.geminiFilter.filterTitles(rssResult.newsItems);
        const step2aDuration = ((Date.now() - step2aStart) / 1000).toFixed(2);
        console.log(`  ✓ Filtered ${titleFiltered.filteredCount} articles in ${step2aDuration}s`);

        // Step 2B: Playwright 본문 크롤링 (45초 목표, 15개만)
        console.log('[Step 2B] Playwright Body Crawling (target: 45s, 15 articles)');
        const step2bStart = Date.now();
        const withContent = await this.extractor.extractMultiple(titleFiltered.newsItems);
        const step2bDuration = ((Date.now() - step2bStart) / 1000).toFixed(2);
        console.log(`  ✓ Extracted ${withContent.length} article bodies in ${step2bDuration}s`);

        // Step 2C: 노이즈 제거 (0.1초 목표)
        console.log('[Step 2C] Noise Removal (target: 0.1s)');
        const step2cStart = Date.now();
        const cleaned = this.noiseRemover.removeNoiseFromItems(withContent);
        const step2cDuration = ((Date.now() - step2cStart) / 1000).toFixed(2);
        console.log(`  ✓ Cleaned ${cleaned.length} articles in ${step2cDuration}s`);

        // Step 3: Gemini 본문 필터링 (3초 목표, 15→3-5)
        console.log('[Step 3] Gemini Body Filtering (target: 3s, 15→3-5)');
        const step3Start = Date.now();
        const bodyFiltered = await this.geminiFilter.filterBodies(cleaned);
        const step3Duration = ((Date.now() - step3Start) / 1000).toFixed(2);
        console.log(`  ✓ Final selection: ${bodyFiltered.filteredCount} articles in ${step3Duration}s`);

        const totalDuration = ((Date.now() - pipelineStart) / 1000).toFixed(2);
        console.log(`=== Pipeline Completed in ${totalDuration}s ===`);

        return bodyFiltered.newsItems;
      } finally {
        await playwrightManager.close();
      }
    }
  }
  ```

##### 13.2. 환경 변수 추가

- [ ] `.env`에 Gemini API 키 추가:

  ```
  GEMINI_API_KEY=your_api_key_here
  ```

- [ ] `src/config/env.ts` 수정:
  ```typescript
  export const env = {
    // ... 기존 코드 ...
    geminiApiKey: process.env.GEMINI_API_KEY || '',
  };
  ```

##### 13.3. Pipeline Integration 테스트

- [ ] `/Users/kim-yongbin/projects/economic-podcast/tests/integration/pipeline.test.ts` 생성
- [ ] 전체 파이프라인 60초 이내 완료 검증
- [ ] 각 단계별 시간 측정 및 로깅
- [ ] 최종 3-5개 뉴스 반환 검증

---

### Phase 3: Naver News Support (Week 5-6) ❌ NOT STARTED

#### 14. Naver News Collector 구현

##### 14.1. Naver News Collector 파일 생성

- [ ] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/naver-news/collector.ts` 파일 생성

##### 14.2. Naver News API 설정

- [ ] 네이버 개발자 센터에서 API 키 발급 (선택사항)
- [ ] `.env`에 환경 변수 추가:
  ```
  NAVER_CLIENT_ID=your_client_id
  NAVER_CLIENT_SECRET=your_client_secret
  ```

##### 14.3. Naver News Collector 구현

- [ ] Collector 클래스 작성 (32개 키워드 적용)
- [ ] Naver API 또는 크롤링 방식 결정

##### 14.4. 환경 변수 추가

- [ ] `src/config/env.ts`에 네이버 API 키 추가

---

#### 15. Naver News Extractor 구현

##### 15.1. Naver News Extractor 파일 생성

- [ ] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/naver-news/extractor.ts` 파일 생성

##### 15.2. Extractor 클래스 구현

- [ ] 네이버 뉴스 본문 추출 (Playwright 사용)
- [ ] 네이버 뉴스 페이지 셀렉터 최적화

##### 15.3. Naver Collector와 Extractor 통합

- [ ] `naver-news/collector.ts`에 Extractor 연동 추가

---

### Phase 4: Deduplication & Finalization (Week 7-8) ❌ NOT STARTED

#### 16. 중복 제거 로직 구현 (FR-001-06)

##### 16.1. Deduplicator 파일 생성

- [ ] `/Users/kim-yongbin/projects/economic-podcast/src/modules/news-collector/deduplicator.ts` 파일 생성

##### 16.2. Deduplicator 클래스 구현

- [ ] URL 기반 정확한 중복 제거
- [ ] 제목 유사도 90% 이상 중복 제거

##### 16.3. Deduplicator 테스트

- [ ] URL 중복 제거 테스트
- [ ] 유사도 90% 이상 중복 제거 테스트
- [ ] 유사도 89% 미만 유지 테스트

---

#### 17. 로깅 통합

##### 17.1. Winston 설치 및 설정

- [ ] Winston 설치
- [ ] `/Users/kim-yongbin/projects/economic-podcast/src/modules/logger/index.ts` 생성

##### 17.2. Logger 설정

- [ ] Winston logger 구성 (파일 + 콘솔)

##### 17.3. console.log를 logger로 교체

- [ ] 모든 Collector에서 `console.log` → `logger.info` 변경
- [ ] 모든 `console.error` → `logger.error` 변경

---

#### 18. 설정 관리 (Constants)

##### 18.1. Constants 파일 생성

- [ ] `/Users/kim-yongbin/projects/economic-podcast/src/config/constants.ts` 생성

##### 18.2. 뉴스 수집 설정 정의

- [ ] 설정 상수 작성 (MIN_NEWS_COUNT, SIMILARITY_THRESHOLD 등)
- [ ] 32개 키워드 import 및 export

---

#### 19. 에러 처리 및 재시도 로직

##### 19.1. Retry Utility 생성

- [ ] `/Users/kim-yongbin/projects/economic-podcast/src/utils/retry.ts` 파일 생성
- [ ] Exponential backoff 재시도 함수 구현

##### 19.2. 수집기에 재시도 로직 적용

- [ ] Google News Collector에 재시도 적용
- [ ] Naver News Collector에 재시도 적용
- [ ] Extractor에 재시도 적용

---

#### 20. 단위 테스트 작성

##### 20.1. Extractor 테스트

- [ ] Google News Extractor 테스트
- [ ] Naver News Extractor 테스트
- [ ] 본문 추출 실패 시 fallback 테스트

##### 20.2. Deduplicator 테스트

- [ ] URL 중복 제거 테스트
- [ ] 유사도 중복 제거 테스트

##### 20.3. Main Collector 테스트

- [ ] Mock을 사용한 통합 테스트
- [ ] 최소 개수 미달 시 에러 테스트

---

#### 21. 통합 테스트 작성

##### 21.1. End-to-End 테스트

- [ ] 실제 환경에서 뉴스 수집 테스트 (최소 3-5개)
- [ ] 모든 필드 검증
- [ ] 중복 제거 검증
- [ ] 60초 이내 완료 검증

---

## Acceptance Criteria (FR-001)

### 기능 요구사항 완료 확인

- [x] **FR-001-01**: 당일 0시~22시 뉴스 수집 ✅
- [ ] **FR-001-02**: 32개 키워드 기반 수집 ⚠️ 구현 중
- [ ] **FR-001-03**: 필수 필드 + 본문 추출 ⚠️ Extractor 완료, 파이프라인 통합 필요
- [x] **FR-001-04**: 본문 추출 (동적/정적) ✅ Playwright 완료
- [x] **FR-001-05**: 날짜 필터링 ✅
- [ ] **FR-001-06**: 2단계 Gemini 필터링 (100→15→3-5) ❌ 구현 필요
- [ ] **FR-001-07**: 11가지 노이즈 제거 ❌ 구현 필요
- [ ] **FR-001-08**: 60초 이내 완료 ❌ 파이프라인 최적화 필요

### Performance Targets (from PRD)

| Stage              | Target Time | Status |
| ------------------ | ----------- | ------ |
| RSS Collection     | 10s         | ❌     |
| Gemini Title       | 2s          | ❌     |
| Playwright Crawl   | 45s         | ❌     |
| Noise Removal      | 0.1s        | ❌     |
| Gemini Body        | 3s          | ❌     |
| **Total Pipeline** | **60s**     | ❌     |

---

## Next Steps (Immediate Priority)

### Week 3 (Current Sprint)

1. **즉시 진행**: 32 Keyword Configuration (Task 10)
   - `src/config/keywords.ts` 생성
   - 3단계 계층 구조 정의
   - Google News Collector 적용

2. **즉시 진행**: Gemini Filter 모듈 (Task 11)
   - Title Filter 구현 (100→15)
   - Body Filter 구현 (15→3-5)
   - 테스트 작성

3. **즉시 진행**: Noise Remover 모듈 (Task 12)
   - 11가지 패턴 정의
   - 800자 정제 로직
   - 성능 최적화 (0.1초 목표)

### Week 4 (Next Sprint)

4. **Pipeline Integration** (Task 13)
   - Main Collector 파이프라인 통합
   - 60초 목표 검증
   - 통합 테스트

---

## Dependencies

### External APIs

- ✅ Playwright (installed)
- ❌ Gemini API (Google) - API 키 필요
- ❌ Naver News API (optional) - Phase 3

### Internal Modules

- ✅ Playwright Manager (completed)
- ✅ Cheerio Utils (completed)
- ✅ Google News Extractor (completed)
- ❌ Gemini Filter (pending)
- ❌ Noise Remover (pending)
- ❌ Deduplicator (pending)

---

## Risks & Mitigation

| Risk                          | Impact | Mitigation                                 |
| ----------------------------- | ------ | ------------------------------------------ |
| Gemini API 비용 초과          | High   | 일일 요청 수 제한 설정                     |
| 60초 타임아웃 초과            | High   | 병렬 처리 최적화, 타임아웃 단계별 모니터링 |
| Playwright 크롤링 실패 (15개) | Medium | Fallback to Cheerio, 재시도 로직           |
| Gemini 응답 파싱 실패         | Medium | JSON 검증 로직 + Fallback (첫 N개 반환)    |
| 32개 키워드로 100개 미달      | Medium | 키워드 추가 또는 키워드당 수집 개수 조정   |
| Noise Removal 후 800자 미만   | Low    | 문장 완결성 우선, 최소 길이 검증 추가      |

---

## Notes

- **PRD 변경사항 반영 완료:** 2-stage Gemini pipeline, 32 keywords, 11 noise patterns
- **완료된 작업 보존:** Phase 1 (Section 7-9) 모든 체크박스 유지
- **새 작업 추가:** Phase 2 (Section 10-13) - Gemini Filter, Noise Remover, Pipeline Integration
- **성능 목표 명확화:** 각 단계별 시간 제약 추가
- **테스트 전략:** 각 모듈별 단위 테스트 + 파이프라인 통합 테스트

---

**마지막 업데이트:** 2026-01-05
**다음 리뷰:** Week 3 완료 후
