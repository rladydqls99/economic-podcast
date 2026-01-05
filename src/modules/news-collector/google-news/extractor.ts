import { playwrightManager } from '../shared/playwright-manager.js';
import { cleanHtml, extractArticleContent } from '../shared/cheerio-utils.js';
import { NewsItem } from '../types.js';
import { chatJSON } from '@/utils/gemini.js';
import { NOISE_PATTERNS } from '@/config/noise_patterns.js';

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
        '#article-content',
        '#articleContent',
        '.news-content',
        '.article-body',
        '#articleBody',
        '#argicle-body',
        'main',
        '.post-content',
        '.entry-content',
        '[itemprop="articleBody"]',
      ]);

      return {
        ...newsItem,
        content: content || undefined,
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
   * 여러 기사 일괄 처리 + 2차 필터링
   *
   * @param newsItems - 본문을 추출할 뉴스 아이템 배열 (15개)
   * @returns 본문 기반 최종 필터링된 뉴스 3개
   *
   * @description
   * Step 1: 15개 기사 본문 추출 (순차 처리)
   * Step 2: Gemini로 본문 분석하여 쇼츠 적합 3개 선별
   */
  async extractMultiple(newsItems: NewsItem[]): Promise<NewsItem[]> {
    // Step 1: 본문 추출
    const results: NewsItem[] = [];

    for (const item of newsItems) {
      const extracted = await this.extractContent(item);
      if (extracted.content) {
        results.push(extracted);
      }
    }

    // Step 2: 본문 기반 최종 필터링 (15개 → 3개)
    const finalNews = await this.finalFilterForShorts(results);
    return finalNews;
  }

  /**
   * 본문 기반 최종 필터링 (2차 필터링)
   *
   * @param newsItems - 본문이 추출된 뉴스 15개
   * @returns 쇼츠 스크립트 작성 가능한 최종 3개
   *
   * @description
   * - 본문 내용까지 분석하여 쇼츠 적합도 평가
   * - "스크립트 작성 가능성"까지 고려
   * - 제목과 본문 괴리 감지 (낚시 제목 제외)
   */
  private async finalFilterForShorts(newsItems: NewsItem[]): Promise<NewsItem[]> {
    if (newsItems.length === 0) {
      return [];
    }

    try {
      const newsWithId = newsItems.map((item, index) => ({
        id: index,
        title: item.title,
        content: this.extractMeaningfulContent(item.content || ''),
      }));

      const prompt = this.buildFinalFilteringPrompt(newsWithId);
      const filtered = await chatJSON<{ id: number; title: string }[]>(prompt);

      // AI가 선별한 ID에 해당하는 뉴스만 추출
      const selectedIds = new Set(filtered.map((item) => item.id));
      return newsItems.filter((_, index) => selectedIds.has(index));
    } catch (error) {
      console.error('최종 필터링 중 오류 발생:', error);
      // 실패 시 앞 3개 반환
      return newsItems.slice(0, 3);
    }
  }

  /**
   * 본문에서 의미있는 내용만 추출 (노이즈 제거)
   *
   * @param content - 원본 본문
   * @returns 정제된 본문 (최대 800자)
   *
   * @description
   * - 광고성 문구, 구독 유도, 저작권 안내 등 제거
   * - 짧은 문장들은 건너뛰고 본문 시작 지점 탐지
   * - 실제 뉴스 내용 위주로 추출
   */
  private extractMeaningfulContent(content: string): string {
    if (!content) return '';

    // 1. 문장 단위로 분리 (개행 기준)
    const lines = content.split('\n').map((line) => line.trim());

    // 3. 의미있는 문장만 필터링
    const meaningfulLines: string[] = [];
    let foundStart = false;

    for (const line of lines) {
      // 빈 줄 스킵
      if (!line || line.length < 10) continue;

      // 노이즈 패턴 매칭 시 스킵
      if (NOISE_PATTERNS.some((pattern) => pattern.pattern.test(line))) continue;

      // 첫 의미있는 문장 발견
      if (!foundStart && line.length >= 30) {
        foundStart = true;
      }

      if (foundStart) {
        meaningfulLines.push(line);
      }
    }

    // 4. 합치기 (최대 800자)
    const cleaned = meaningfulLines.join(' ');

    // 5. 800자로 자르되, 문장 중간에서 자르지 않도록
    if (cleaned.length <= 800) {
      return cleaned;
    }

    // 마지막 마침표 찾기 (800자 이내)
    const truncated = cleaned.slice(0, 800);
    const lastPeriod = Math.max(truncated.lastIndexOf('.'), truncated.lastIndexOf('다'), truncated.lastIndexOf('요'));

    return lastPeriod > 400 ? truncated.slice(0, lastPeriod + 1) : truncated;
  }

  /**
   * 본문 기반 최종 필터링 프롬프트
   */
  private buildFinalFilteringPrompt(news: { id: number; title: string; content?: string }[]): string {
    return `
당신은 밤 11시, 침대에서 쇼츠를 넘기는 25-40대 직장인의 뇌를 해킹하는 경제 콘텐츠 PD입니다.

## 🎯 미션
아래 뉴스 중 **3초 안에 스크롤을 멈추게 만들** 뉴스 5개를 선별하세요.

## 🔥 필수 선별 기준 (이것만 통과)

### 1. 즉각 반응 유발 (The Hook Test)
**첫 3초에 이런 반응이 나와야 함:**
- "헐 진짜??" (놀람)
- "아 망했다..." (불안)
- "이거 나한테도?" (자기 관련성)
- "개꿀이네?" (기회)
- "ㅋㅋㅋ 레전드" (재미)

**구체적 요소:**
- 충격적인 숫자 (10조원, 50% 폭락, 3배 급등)
- 유명 기업/인물의 예상 밖 행보
- 긴박한 시한 ("내일부터", "이번 주 안에")
- 내 월급/집값/통장과 직결

### 2. 행동 유도 (Action Trigger)
**영상 본 뒤 이런 생각 들게:**
- "내일 출근해서 동료한테 얘기해야지"
- "단톡방에 공유해야겠다"
- "내일 아침에 확인해봐야지"
- "엄마/배우자한테 알려줘야겠다"

**제외: 듣고 끝나는 뉴스**
- "아 그렇구나~" 하고 넘김
- 행동 변화 없음
- 공유 가치 없음

### 3. 스토리 완결성 (45초 Rule)
**45초 안에 완성되는 기승전결:**
- 기: "삼성전자 주가가..." (3초 Hook)
- 승: "왜냐하면 반도체 시장이..." (15초 설명)
- 전: "그런데 문제는..." (15초 반전)
- 결: "그래서 당신은..." (12초 행동 제시)

**제외: 복잡한 뉴스**
- 배경 설명만 30초 필요
- 전문 용어 4개 이상
- "이건 또 뭔데..." 혼란

### 4. 바이럴 DNA (Shareable Factor)
**SNS 댓글 폭발 예상:**
- 찬반 논쟁 ("이건 좋은 거 아냐?" vs "망하는 신호임")
- 세대 갈등 ("MZ는 몰라" vs "꼰대들이")
- 지역 대결 (서울 vs 지방)
- 계층 이슈 (부자 vs 서민)

**공유 유도 멘트 상상:**
- "이거 실화냐??"
- "나만 몰랐나..."
- "진작 알았으면..."

## ❌ 무조건 제외

### 뻔한 뉴스
- "코스피 0.3% 하락" → 누가 관심 있음?
- "정부, 경제정책 발표" → 매일 하는 얘기
- "전문가, ○○전망" → 맨날 틀림

### 낚시 제목
- 제목: "삼성전자 초비상!" → 본문: "그냥 분기보고서 발표"
- 제목: "부동산 대폭락!" → 본문: "일부 지역 1% 하락"

### 무관한 뉴스
- 브라질 내수 경제
- 전문가만 아는 금융 상품
- 한국 영향 제로

### 주가와 관계없는 기업 제품 소식
- 아이오닉, 제네시스 할인
- 현대차, 티볼리 할인

## 💎 꿀팁: 이런 뉴스는 무조건 선택

1. **내 지갑 충격탄**
   - "대출 금리 0.5%p 인상" (매달 20만원↑)
   - "전기요금 30% 인상" (이번 달 청구서 폭탄)
   - "집값 급락" or "집값 급등" (패닉 or 후회)

2. **유명인/기업 반전**
   - "삼성 1만명 구조조정" (내 회사는?)
   - "일론 머스크, 비트코인 전량 매도" (충격)
   - "네이버, AI로 직원 30% 대체" (내일은 나?)

3. **시한폭탄**
   - "이번 주 금요일까지 신청 안 하면 손해"
   - "내일부터 단속 강화"
   - "3월까지만 혜택"

4. **금지된 진실**
   - "은행들이 숨기는 예금 꿀팁"
   - "부자들만 아는 절세 방법"
   - "정부 발표와 다른 실제 상황"

5. **저축, 투자, 재산 관리**
   - 새로움 저축 및 투자 상품 소식 
   - "은행이 숨기는 예금 꿀팁"
   - "부자들만 아는 절세 방법"
   - "정부 발표와 다른 실제 상황"

## 📝 입력 데이터
${JSON.stringify(news, null, 2)}

## 출력 형식
JSON 배열로만 응답 (다른 말 하지 마):
[
  {
    "id": 숫자,
    "title": "제목"
  }
]

**반드시 3개만 선별. 2개도 안 되고 4개도 안 됨.**
`;
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
