/**
 * Prompt Builder
 *
 * Builds AI prompts for script generation based on viral principles and 45-second rule.
 * Supports multiple tone templates for A/B testing.
 *
 * @module script-generator/prompt-builder
 */

import { NewsItem } from '@/modules/news-collector/types.js';
import { ScriptGeneratorConfig } from './types.js';

// =================================================================
// Prompt Templates
// =================================================================

/**
 * URGENT_TONE_TEMPLATE
 *
 * Emphasizes urgency and immediate impact.
 * Best for breaking news and time-sensitive economic events.
 */
const URGENT_TONE_TEMPLATE = (newsContext: string, viralPrinciples: string): string => `
당신은 밤 11시, 침대에서 쇼츠를 넘기는 25-40대 직장인을 3초 안에 멈추게 하는 경제 쇼츠 작가입니다.

**오늘의 경제 뉴스:**
${newsContext}

**미션:** 위 뉴스를 바탕으로 45초 분량의 바이럴 쇼츠 대본을 작성하세요.

**대본 구조 (45초 Rule):**
1. **Hook (0-3초):** 충격적인 사실로 시작
   - 예: "삼성전자 주가 -5% 급락!"
   - 반드시 숫자 또는 구체적 사실 포함
   - 긴급성을 강조하는 표현 사용 ("방금", "오늘", "긴급")
2. **문제 (3-15초):** 배경 설명
   - 왜 이런 일이 발생했는가?
   - 간결하게 2-3문장
   - 위기감을 조성하는 팩트 제시
3. **영향 (15-40초):** "내 지갑에 미치는 영향"
   - 개인 관련성 강조
   - "당신의", "내 월급" 등 직접 호명
   - 구체적 숫자와 시나리오 제시
4. **결론 (40-45초):** 행동 유도
   - 예: "내일 출근해서 동료한테 얘기해보세요"
   - 즉각적이고 구체적인 행동 제시
   - 시급성 강조

${viralPrinciples}

**출력 형식 (JSON):**
{
  "hook": "첫 3초 문장 (충격적 사실, 긴급성 강조)",
  "problem": "문제 설명 (배경, 위기 조성, 2-3문장)",
  "impact": "개인 영향 (내 지갑 관련성, 구체적 숫자, 3-4문장)",
  "conclusion": "결론 및 CTA (즉각적 행동 유도)"
}

**제약사항:**
- 전체 길이: 180-270자 (한글 기준, 4-5자/초 속도)
- Hook: 10-30자
- 문제: 50-100자
- 영향: 100-150자
- 결론: 20-50자
- 반드시 JSON 형식으로만 응답하세요.
`;

/**
 * INFORMATIVE_TONE_TEMPLATE
 *
 * Focuses on clear information delivery and educational value.
 * Best for complex economic policies and analysis.
 */
const INFORMATIVE_TONE_TEMPLATE = (newsContext: string, viralPrinciples: string): string => `
당신은 경제 전문가로서 25-40대 직장인에게 복잡한 경제 뉴스를 쉽고 명확하게 설명하는 교육 콘텐츠 작가입니다.

**오늘의 경제 뉴스:**
${newsContext}

**미션:** 위 뉴스를 바탕으로 45초 분량의 정보 전달 중심 쇼츠 대본을 작성하세요.

**대본 구조 (45초 Rule):**
1. **Hook (0-3초):** 핵심 질문 또는 흥미로운 사실
   - 예: "금리 인상이 내 대출에 어떤 영향을 줄까요?"
   - 호기심을 유발하는 질문 형태
   - 명확한 팩트 제시
2. **문제 (3-15초):** 배경 설명
   - 현상의 원인과 맥락 설명
   - 전문 용어는 쉬운 말로 풀어서 설명
   - 논리적 흐름 유지
3. **영향 (15-40초):** "실생활에 미치는 영향"
   - 개인의 경제 생활과 연결
   - 구체적 사례와 숫자로 설명
   - "예를 들어", "만약" 등의 표현 활용
4. **결론 (40-45초):** 핵심 요약 및 인사이트
   - 배운 내용 한 문장으로 정리
   - 실용적 팁 또는 주의사항 제공
   - 교육적 가치 강조

${viralPrinciples}

**출력 형식 (JSON):**
{
  "hook": "첫 3초 질문 또는 사실 (호기심 유발)",
  "problem": "문제 설명 (배경, 맥락, 쉬운 용어, 2-3문장)",
  "impact": "실생활 영향 (구체적 사례, 숫자, 3-4문장)",
  "conclusion": "핵심 요약 및 인사이트 (실용적 팁)"
}

**제약사항:**
- 전체 길이: 180-270자 (한글 기준, 4-5자/초 속도)
- Hook: 10-30자
- 문제: 50-100자
- 영향: 100-150자
- 결론: 20-50자
- 반드시 JSON 형식으로만 응답하세요.
`;

/**
 * CONVERSATIONAL_TONE_TEMPLATE
 *
 * Uses casual, conversational style with storytelling elements.
 * Best for engaging younger audiences and building rapport.
 */
const CONVERSATIONAL_TONE_TEMPLATE = (newsContext: string, viralPrinciples: string): string => `
당신은 친구에게 경제 뉴스를 재미있게 설명해주는 스토리텔러입니다. 25-40대 직장인이 "오, 이거 몰랐는데?"라고 반응하게 만드는 대화체 작가입니다.

**오늘의 경제 뉴스:**
${newsContext}

**미션:** 위 뉴스를 바탕으로 45초 분량의 친근한 대화체 쇼츠 대본을 작성하세요.

**대본 구조 (45초 Rule):**
1. **Hook (0-3초):** 친근한 질문 또는 공감
   - 예: "여러분, 요즘 삼성전자 주가 보셨어요?"
   - 시청자와 대화하는 느낌
   - "여러분", "혹시" 등 친근한 표현
2. **문제 (3-15초):** 스토리텔링 방식 설명
   - "그런데 말이죠", "사실은" 등 대화체 연결어
   - 이야기하듯 자연스럽게 설명
   - 비유와 예시 적극 활용
3. **영향 (15-40초):** "우리에게 이게 왜 중요한지"
   - "여러분도 느끼셨을 거예요" 같은 공감 표현
   - 일상적 언어로 쉽게 풀어서 설명
   - "예를 들면", "쉽게 말하면" 활용
4. **결론 (40-45초):** 친구처럼 조언
   - 예: "그러니까 이번 주는 좀 지켜봐야겠죠?"
   - 편안한 마무리 멘트
   - 함께 생각해보자는 느낌

${viralPrinciples}

**출력 형식 (JSON):**
{
  "hook": "첫 3초 친근한 질문 또는 공감 (대화체)",
  "problem": "스토리텔링 설명 (대화체, 비유, 2-3문장)",
  "impact": "공감 기반 영향 설명 (일상 언어, 3-4문장)",
  "conclusion": "친구처럼 조언 (편안한 마무리)"
}

**제약사항:**
- 전체 길이: 180-270자 (한글 기준, 4-5자/초 속도)
- Hook: 10-30자
- 문제: 50-100자
- 영향: 100-150자
- 결론: 20-50자
- 반드시 JSON 형식으로만 응답하세요.
`;

/**
 * Template Selector Type
 */
type PromptTemplate =
  | typeof URGENT_TONE_TEMPLATE
  | typeof INFORMATIVE_TONE_TEMPLATE
  | typeof CONVERSATIONAL_TONE_TEMPLATE;

// =================================================================
// Prompt Builder Class
// =================================================================

/**
 * PromptBuilder
 *
 * Constructs AI prompts for script generation.
 * Supports multiple tone templates and viral principles.
 *
 * @example
 * ```typescript
 * const builder = new PromptBuilder({ temperature: 0.7 });
 * const prompt = builder.buildScriptPrompt(newsItems);
 * ```
 */
export class PromptBuilder {
  private config: ScriptGeneratorConfig;
  private template: PromptTemplate;

  constructor(config?: Partial<ScriptGeneratorConfig>, scriptTone?: string) {
    this.config = {
      temperature: config?.temperature ?? 0.7,
      maxTokens: config?.maxTokens ?? 500,
      timeout: config?.timeout ?? 5000,
    };

    // Select template based on arguments, environment variable, or default to URGENT
    const tone = scriptTone || 'URGENT';
    this.template = this.selectTemplate(tone);
  }

  /**
   * Build Script Prompt
   *
   * Generates a complete prompt for script generation from news items.
   *
   * @param newsItems - Array of news items (3-5 items)
   * @returns Complete prompt string
   *
   * @throws {Error} If newsItems is empty or invalid
   */
  buildScriptPrompt(newsItems: NewsItem[]): string {
    if (!newsItems || newsItems.length === 0) {
      throw new Error('News items cannot be empty');
    }

    if (newsItems.length < 3) {
      throw new Error('At least 3 news items are required for script generation');
    }

    if (newsItems.length > 5) {
      throw new Error('Maximum 5 news items allowed for script generation');
    }

    const newsContext = this.buildNewsContext(newsItems);
    const viralPrinciples = this.applyViralPrinciples();

    return this.constructPrompt(newsContext, viralPrinciples);
  }

  /**
   * Build News Context
   *
   * Constructs a formatted context string from news items.
   * Includes title, summary, and optional content.
   *
   * @param newsItems - Array of news items
   * @returns Formatted news context string
   * @private
   */
  private buildNewsContext(newsItems: NewsItem[]): string {
    return newsItems
      .map((item, index) => {
        let context = `[뉴스 ${index + 1}] ${item.title}`;
        context += `\n- 요약: ${item.summary}`;

        if (item.content && item.content.trim().length > 0) {
          context += `\n- 본문: ${item.content}`;
        }

        context += `\n- 출처: ${item.source}`;
        context += `\n- 발행: ${item.publishedAt.toISOString().split('T')[0]}`;

        return context;
      })
      .join('\n\n');
  }

  /**
   * Apply Viral Principles
   *
   * Returns viral DNA principles for script generation.
   * Consistent across all templates.
   *
   * @returns Viral principles string
   * @private
   */
  private applyViralPrinciples(): string {
    return `**바이럴 DNA 원칙:**
- 첫 3초에 숫자 또는 충격적 사실 포함
- "당신의", "내 지갑", "우리" 등 직접 호명으로 개인 관련성 강화
- 감정 트리거 단어 사용: "급락", "위험", "기회", "충격", "경고"
- 구체적 숫자 제시 (%, 금액, 날짜 등)
- 명확한 행동 유도 (CTA) 포함
- 한국 문화와 경제 상황에 맞는 표현 사용
- 전문 용어는 쉬운 말로 풀어서 설명`;
  }

  /**
   * Construct Prompt
   *
   * Combines news context and viral principles into final prompt.
   *
   * @param newsContext - Formatted news context
   * @param viralPrinciples - Viral principles string
   * @returns Complete prompt string
   * @private
   */
  private constructPrompt(newsContext: string, viralPrinciples: string): string {
    return this.template(newsContext, viralPrinciples);
  }

  /**
   * Select Template
   *
   * Selects prompt template based on tone setting.
   *
   * @param tone - Tone setting from environment variable
   * @returns Selected prompt template function
   * @private
   */
  private selectTemplate(tone?: string): PromptTemplate {
    const normalizedTone = tone?.toUpperCase().trim();

    switch (normalizedTone) {
      case 'INFORMATIVE':
        return INFORMATIVE_TONE_TEMPLATE;
      case 'CONVERSATIONAL':
        return CONVERSATIONAL_TONE_TEMPLATE;
      case 'URGENT':
      default:
        return URGENT_TONE_TEMPLATE;
    }
  }

  /**
   * Get Current Template Name
   *
   * Returns the name of the currently selected template.
   * Useful for debugging and testing.
   *
   * @returns Template name ('URGENT', 'INFORMATIVE', or 'CONVERSATIONAL')
   */
  getTemplateName(): string {
    if (this.template === INFORMATIVE_TONE_TEMPLATE) return 'INFORMATIVE';
    if (this.template === CONVERSATIONAL_TONE_TEMPLATE) return 'CONVERSATIONAL';
    return 'URGENT';
  }
}
