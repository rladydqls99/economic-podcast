# Script Generator Implementation Plan (FR-002)

**Document Version:** 1.0
**Last Updated:** 2026-01-08
**Status:** Planning
**PRD Reference:** FR-002 (대본 생성 모듈)

---

## Overview

This document outlines the implementation plan for **FR-002: Script Generation Module**, which automatically generates 45-second viral shorts scripts from filtered economic news using Gemini API.

### Key Requirements from PRD

**PRD Section 5.2 (FR-002)**: 대본 생성 모듈

- 45초 바이럴 쇼츠 대본 자동 생성
- 4단계 구조: Hook (0-3초) → 문제 (3-15초) → 영향 (15-40초) → 결론 (40-45초)
- Gemini API 사용

**PRD Section 8.1 Step 2**: 대본 생성 데이터 플로우

- Input: 최종 뉴스 3-5개
- Process: Gemini API 호출 (프롬프트: 쇼츠용 대본 생성)
- Output: 대본 텍스트 반환

**PRD Section 9.1 NFR-PERF-02**: 대본 생성 응답 시간

- Target: 10초 이내

**PRD Section 14.1.2**: Gemini API 호출 예시

- 45-60초 분량 쇼츠 대본 작성
- 첫 3초 Hook, 핵심 내용, 행동 유도 포함

### Success Metrics

- Script generation completes within 10 seconds
- 4-stage structure present in all scripts
- Character count appropriate for 45-second reading (180-270 chars in Korean)
- Hook effectiveness validated (numbers, emotion, direct address)
- CTA (Call-to-Action) present in conclusion

---

## Architecture

### Directory Structure

```
src/modules/script-generator/
├── __test__/
│   ├── generator.unit.test.ts       # ScriptGenerator 단위 테스트
│   ├── prompt-builder.unit.test.ts  # PromptBuilder 단위 테스트
│   └── validator.unit.test.ts       # Validator 단위 테스트
├── generator.ts                     # 메인 스크립트 생성 클래스
├── prompt-builder.ts                # 프롬프트 구성 로직
├── validator.ts                     # 스크립트 검증 로직
├── types.ts                         # TypeScript 타입 정의
└── index.ts                         # 퍼블릭 API 내보내기
```

### Module Responsibilities

#### 1. generator.ts (Main Orchestrator)

**Purpose**: 스크립트 생성 프로세스 전체 관리

**Responsibilities**:

- 필터링된 뉴스 아이템 (3-5개) 수신
- PromptBuilder로 프롬프트 구성
- Gemini API 호출 및 응답 처리
- Validator로 스크립트 검증
- ScriptResult 생성 및 반환

**Key Methods**:

```typescript
class ScriptGenerator {
  constructor(geminiApiKey: string);
  async generateScript(newsItems: NewsItem[]): Promise<ScriptResult>;
  private parseGeminiResponse(response: string): ScriptSections;
  private calculateMetadata(script: string): ScriptMetadata;
}
```

#### 2. prompt-builder.ts (Prompt Engineering)

**Purpose**: Gemini API용 최적화된 프롬프트 생성

**Responsibilities**:

- 45초 Rule 구조 프롬프트 생성
- 뉴스 컨텍스트 주입 (제목, 본문, 키포인트)
- 바이럴 DNA 원칙 적용 (The Hook Test, Action Trigger)
- 타겟 오디언스 톤 설정 (25-40대 직장인)

**Key Methods**:

```typescript
class PromptBuilder {
  buildScriptPrompt(newsItems: NewsItem[]): string;
  private buildNewsContext(newsItems: NewsItem[]): string;
  private applyViralPrinciples(): string;
}
```

#### 3. validator.ts (Quality Control)

**Purpose**: 생성된 스크립트 구조 및 품질 검증

**Responsibilities**:

- 4단계 구조 존재 확인
- 캐릭터 수 검증 (45초 ≈ 180-270자)
- Hook 효과성 검증 (숫자, 감정, 직접 호명)
- CTA 존재 확인

**Key Methods**:

```typescript
class ScriptValidator {
  validateScript(scriptResult: ScriptResult): ValidationResult;
  private checkStructure(sections: ScriptSections): StructureCheck;
  private checkQuality(sections: ScriptSections): QualityCheck;
  private calculateScore(checks: ValidationChecks): number;
}
```

#### 4. types.ts (Type Definitions)

**Purpose**: 모듈 인터페이스 정의

**Key Types**:

```typescript
// 스크립트 생성 설정
interface ScriptGeneratorConfig {
  temperature?: number; // 0.7 기본값
  maxTokens?: number; // 500 기본값
  timeout?: number; // 5000ms 기본값
}

// 스크립트 생성 결과
interface ScriptResult {
  success: boolean;
  script: string; // 전체 45초 스크립트
  sections: ScriptSections;
  metadata: ScriptMetadata;
  validation: ValidationResult;
}

// 4단계 구조
interface ScriptSections {
  hook: string; // 0-3초 (첫 문장)
  problem: string; // 3-15초 (배경 설명)
  impact: string; // 15-40초 (개인 관련성)
  conclusion: string; // 40-45초 (행동 유도)
}

// 메타데이터
interface ScriptMetadata {
  estimatedDuration: number; // 초 단위
  characterCount: number;
  newsCount: number; // 3-5
  generatedAt: Date;
  processingTime: number; // 밀리초
}

// 검증 결과
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100 품질 점수
}
```

---

## Data Flow

### Input (from news-collector)

```typescript
// news-collector 모듈의 최종 출력 (3-5개)
interface NewsItem {
  title: string; // 뉴스 제목
  summary: string; // 요약
  url: string; // 원문 링크
  publishedAt: Date; // 발행 시간
  source: string; // 언론사
  content?: string; // 본문 (Extractor가 추출)
}
```

### Processing Pipeline

```
[NewsItem[] (3-5개)]
         │
         ▼
[PromptBuilder]
         │ buildScriptPrompt()
         ▼
[Gemini API]
         │ generateContent() (5초 이내)
         ▼
[Response Parser]
         │ parseGeminiResponse()
         ▼
[ScriptValidator]
         │ validateScript()
         ▼
[ScriptResult]
```

### Output (to video-generator)

```typescript
interface ScriptResult {
  success: true,
  script: "삼성전자 주가 -5% 급락! 엔비디아 신제품 발표로...", // 전체 스크립트
  sections: {
    hook: "삼성전자 주가 -5% 급락!",
    problem: "엔비디아가 어제 신제품 발표를 하면서...",
    impact: "이게 당신 월급과 무슨 관계냐면...",
    conclusion: "내일 출근해서 동료한테 얘기해보세요"
  },
  metadata: {
    estimatedDuration: 45,
    characterCount: 215,
    newsCount: 3,
    generatedAt: new Date(),
    processingTime: 3200
  },
  validation: {
    isValid: true,
    errors: [],
    warnings: [],
    score: 85
  }
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1) - 기반 구축

#### Task 1.1: 디렉토리 구조 생성

- [x] `/Users/kim-yongbin/projects/economic-podcast/src/modules/script-generator/` 디렉토리 생성
- [x] `__test__/` 서브디렉토리 생성
- [x] 플레이스홀더 파일 생성:
  - `generator.ts`
  - `prompt-builder.ts`
  - `validator.ts`
  - `types.ts`
  - `index.ts`

**Acceptance Criteria**:

- 디렉토리 구조가 news-collector 패턴과 일치
- 모든 파일이 생성되고 기본 export 포함

---

#### Task 1.2: 타입 정의

- [x] `types.ts` 파일 작성:
  - `ScriptGeneratorConfig` 인터페이스
  - `ScriptResult` 인터페이스
  - `ScriptSections` 인터페이스
  - `ScriptMetadata` 인터페이스
  - `ValidationResult` 인터페이스
  - `PromptTemplate` 인터페이스 (Phase 2에서 구현 예정)
- [x] Zod 스키마 추가 (런타임 검증용):
  - `ScriptResultSchema`
  - `ScriptSectionsSchema`
  - `ValidationResultSchema`
- [x] `index.ts`에서 타입 export

**Acceptance Criteria**:

- 모든 인터페이스가 TypeScript strict mode 통과
- Zod 스키마가 인터페이스와 일치
- JSDoc 주석 포함

---

#### Task 1.3: 타입 테스트 작성

- [x] `__test__/types.unit.test.ts` 생성
- [x] Zod 스키마 검증 테스트:
  - 유효한 ScriptResult 검증
  - 유효한 ScriptSections 검증
  - 유효한 ValidationResult 검증
- [x] 엣지 케이스 테스트:
  - 빈 문자열 처리
  - 누락된 필드 처리
  - 잘못된 타입 처리

**Acceptance Criteria**:

- 모든 Zod 스키마 테스트 통과 (49개 테스트 통과)
- 엣지 케이스 처리 검증
- 테스트 커버리지 100%

---

### Phase 2: Prompt Builder (Week 2) - 프롬프트 엔지니어링

#### Task 2.1: PromptBuilder 클래스 생성

- [x] `prompt-builder.ts` 파일 작성
- [x] 생성자 구현 (configuration 인자)
- [x] `buildScriptPrompt(newsItems: NewsItem[]): string` 메서드 추가

**Implementation Pattern** (news-collector의 prompt 패턴 참고):

```typescript
export class PromptBuilder {
  private config: ScriptGeneratorConfig;

  constructor(config?: Partial<ScriptGeneratorConfig>) {
    this.config = {
      temperature: config?.temperature ?? 0.7,
      maxTokens: config?.maxTokens ?? 500,
      timeout: config?.timeout ?? 5000,
    };
  }

  buildScriptPrompt(newsItems: NewsItem[]): string {
    const newsContext = this.buildNewsContext(newsItems);
    const viralPrinciples = this.applyViralPrinciples();
    return this.constructPrompt(newsContext, viralPrinciples);
  }
}
```

---

#### Task 2.2: 45초 Rule 프롬프트 구현

- [x] 프롬프트 템플릿 정의:
  - 타겟 오디언스: "25-40대 직장인, 밤 11시 침대에서 쇼츠 시청"
  - 4단계 구조 명시: Hook → 문제 → 영향 → 결론
  - Hook 예시: "삼성전자 주가 -5% 급락!"
  - 바이럴 DNA 원칙: 충격, 개인 관련성, 행동 유도
- [x] 뉴스 컨텍스트 주입:
  - 제목, 요약, 핵심 포인트
  - 3-5개 뉴스를 자연스럽게 통합
- [x] 한국어 및 문화적 맥락 최적화

**Prompt Template Example**:

```typescript
const SCRIPT_PROMPT_TEMPLATE = `
당신은 밤 11시, 침대에서 쇼츠를 넘기는 25-40대 직장인을 3초 안에 멈추게 하는 경제 쇼츠 작가입니다.

**오늘의 경제 뉴스:**
${newsContext}

**미션:** 위 뉴스를 바탕으로 45초 분량의 바이럴 쇼츠 대본을 작성하세요.

**대본 구조 (45초 Rule):**
1. **Hook (0-3초):** 충격적인 사실로 시작
   - 예: "삼성전자 주가 -5% 급락!"
   - 반드시 숫자 또는 구체적 사실 포함
2. **문제 (3-15초):** 배경 설명
   - 왜 이런 일이 발생했는가?
   - 간결하게 2-3문장
3. **영향 (15-40초):** "내 지갑에 미치는 영향"
   - 개인 관련성 강조
   - "당신의", "내 월급" 등 직접 호명
4. **결론 (40-45초):** 행동 유도
   - 예: "내일 출근해서 동료한테 얘기해보세요"
   - 구체적 행동 제시

**바이럴 DNA 원칙:**
- 첫 3초에 숫자 또는 충격적 사실 포함
- "당신의", "내 지갑" 등 직접 호명
- 감정 트리거: "급락", "위험", "기회"
- 구체적 행동 유도 (CTA)

**출력 형식 (JSON):**
{
  "hook": "첫 3초 문장 (충격적 사실)",
  "problem": "문제 설명 (배경, 2-3문장)",
  "impact": "개인 영향 (내 지갑 관련성, 3-4문장)",
  "conclusion": "결론 및 CTA (행동 유도)"
}

**제약사항:**
- 전체 길이: 180-270자 (한글 기준)
- Hook: 10-30자
- 문제: 50-100자
- 영향: 100-150자
- 결론: 20-50자
`;
```

---

#### Task 2.3: 프롬프트 변형 추가

- [x] A/B 테스트용 다중 템플릿 생성:
  - `URGENT_TONE_TEMPLATE`: 긴급성 강조
  - `INFORMATIVE_TONE_TEMPLATE`: 정보 전달 중심
  - `CONVERSATIONAL_TONE_TEMPLATE`: 대화체
- [x] 템플릿 선택 로직 구현
- [x] 환경 변수로 템플릿 선택 가능하게 구성

---

#### Task 2.4: PromptBuilder 테스트 작성

- [x] `__test__/prompt-builder.unit.test.ts` 생성
- [x] 테스트 시나리오:
  - 3개 뉴스 아이템으로 프롬프트 생성
  - 5개 뉴스 아이템으로 프롬프트 생성
  - 4단계 구조 지시사항 포함 검증
  - 뉴스 컨텍스트 정확한 주입 검증
  - 한글 인코딩 테스트
  - 템플릿 변형 테스트 (3가지 톤)

**Acceptance Criteria**:

- [x] PromptBuilder가 유효한 프롬프트 생성
- [x] 프롬프트에 4단계 지시사항 모두 포함
- [x] 뉴스 컨텍스트 정확히 주입
- [x] 테스트 커버리지 100% 달성 (목표 90% 초과)

---

### Phase 3: Script Generator Core (Week 3) - 핵심 생성 로직

#### Task 3.1: ScriptGenerator 클래스 생성

- [x] `generator.ts` 파일 작성 (index.ts에 구현)
- [x] 생성자 구현 (Gemini API 키 인자)
- [x] `generateScript(newsItems: NewsItem[]): Promise<ScriptResult>` 메서드 추가

**Implementation Pattern**:

```typescript
import { chatJSON } from '@/utils/gemini.js';
import { NewsItem } from '@/modules/news-collector/types.js';
import { PromptBuilder } from './prompt-builder.js';
import { ScriptValidator } from './validator.js';
import { ScriptResult, ScriptSections } from './types.js';

export class ScriptGenerator {
  private promptBuilder: PromptBuilder;
  private validator: ScriptValidator;
  private config: ScriptGeneratorConfig;

  constructor(config?: Partial<ScriptGeneratorConfig>) {
    this.config = {
      temperature: config?.temperature ?? 0.7,
      maxTokens: config?.maxTokens ?? 500,
      timeout: config?.timeout ?? 5000,
    };
    this.promptBuilder = new PromptBuilder(this.config);
    this.validator = new ScriptValidator();
  }

  async generateScript(newsItems: NewsItem[]): Promise<ScriptResult> {
    const startTime = Date.now();

    // 입력 검증
    if (newsItems.length < 3 || newsItems.length > 5) {
      throw new Error(`Invalid news count: ${newsItems.length} (expected 3-5)`);
    }

    // 프롬프트 생성
    const prompt = this.promptBuilder.buildScriptPrompt(newsItems);

    // Gemini API 호출
    const sections = await this.callGeminiAPI(prompt);

    // 메타데이터 계산
    const metadata = this.calculateMetadata(sections, newsItems.length, startTime);

    // 스크립트 결과 구성
    const scriptResult: ScriptResult = {
      success: true,
      script: this.combineSection(sections),
      sections,
      metadata,
      validation: { isValid: true, errors: [], warnings: [], score: 0 }, // 나중에 검증
    };

    // 검증
    const validation = this.validator.validateScript(scriptResult);
    scriptResult.validation = validation;

    return scriptResult;
  }
}
```

---

#### Task 3.2: Gemini API 통합

- [x] `@/utils/gemini.js`에서 `chatJSON` import
- [x] Gemini API 호출 설정:
  - Model: `gemini-3-flash-preview` (기본값)
  - Temperature: 0.7 (창의적이지만 일관성 유지)
  - MaxTokens: 500 (45초 스크립트 충분)
  - Timeout: 5000ms (NFR-PERF-02)
- [x] 에러 핸들링:
  - try-catch로 API 오류 처리
  - 타임아웃 오류 별도 처리
  - 응답 파싱 오류 처리
- [x] 재시도 로직 추가:
  - 최대 2회 재시도
  - Exponential backoff (1초, 2초)

**Implementation**:

```typescript
private async callGeminiAPI(prompt: string): Promise<ScriptSections> {
  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[ScriptGenerator] Gemini API 호출 (시도 ${attempt + 1}/${maxRetries + 1})`);

      const response = await chatJSON<ScriptSections>(prompt, {
        model: 'gemini-3-flash-preview',
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      });

      console.log(`[ScriptGenerator] Gemini API 호출 성공`);
      return response;
    } catch (error) {
      lastError = error as Error;
      console.error(`[ScriptGenerator] Gemini API 호출 실패 (시도 ${attempt + 1}):`, error);

      if (attempt < maxRetries) {
        const backoffTime = Math.pow(2, attempt) * 1000; // 1s, 2s
        console.log(`[ScriptGenerator] ${backoffTime}ms 후 재시도...`);
        await this.sleep(backoffTime);
      }
    }
  }

  throw new Error(`Gemini API 호출 실패 (${maxRetries + 1}회 시도): ${lastError?.message}`);
}

private sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

#### Task 3.3: Gemini 응답 파싱

- [x] 4단계 구조 추출:
  - `hook`, `problem`, `impact`, `conclusion` 필드 파싱
  - JSON 형식 검증
- [x] 메타데이터 계산:
  - `characterCount`: 전체 스크립트 길이
  - `estimatedDuration`: 캐릭터 수 기반 예상 시간 (4-5 chars/sec)
  - `processingTime`: API 호출 소요 시간
- [x] 잘못된 응답 처리:
  - JSON 파싱 실패 시 fallback (원본 텍스트 반환)
  - 누락된 섹션 처리 (빈 문자열로 채우기)

**Implementation**:

```typescript
private calculateMetadata(
  sections: ScriptSections,
  newsCount: number,
  startTime: number
): ScriptMetadata {
  const script = this.combineSections(sections);
  const characterCount = script.length;
  const estimatedDuration = Math.round(characterCount / 4.5); // 4.5 chars/sec (Korean)
  const processingTime = Date.now() - startTime;

  return {
    estimatedDuration,
    characterCount,
    newsCount,
    generatedAt: new Date(),
    processingTime,
  };
}

private combineSections(sections: ScriptSections): string {
  return [
    sections.hook,
    sections.problem,
    sections.impact,
    sections.conclusion,
  ].join(' ');
}
```

---

#### Task 3.4: 로깅 추가

- [x] 요청 타이밍 로깅 (시작, 종료, 소요 시간)
- [x] 뉴스 개수 및 제목 로깅
- [x] 캐릭터 수 및 예상 시간 로깅
- [x] 검증 결과 로깅

**Logging Example**:

```typescript
console.log(`[ScriptGenerator] 스크립트 생성 시작 (뉴스 ${newsItems.length}개)`);
console.log(`[ScriptGenerator] 뉴스 제목: ${newsItems.map((n) => n.title).join(', ')}`);
console.log(`[ScriptGenerator] 생성 완료: ${metadata.characterCount}자, 예상 ${metadata.estimatedDuration}초`);
console.log(`[ScriptGenerator] 처리 시간: ${metadata.processingTime}ms`);
console.log(`[ScriptGenerator] 검증 점수: ${validation.score}/100`);
```

---

#### Task 3.5: Generator 테스트 작성

- [x] `__test__/generator.unit.test.ts` 생성
- [x] 테스트 시나리오:
  - 유효한 3-5개 뉴스 아이템으로 스크립트 생성
  - API 타임아웃 테스트 (mock 느린 응답)
  - API 실패 테스트 (mock 에러 응답)
  - 재시도 로직 테스트 (mock 일시적 실패)
  - 응답 파싱 테스트 (유효/잘못된 JSON)
  - 캐릭터 수 계산 테스트
  - 입력 검증 테스트 (0개, 6개 뉴스)

**Test Example**:

```typescript
describe('ScriptGenerator', () => {
  describe('generateScript', () => {
    it('should generate script from 3 news items', async () => {
      const mockNews: NewsItem[] = [
        { title: '뉴스1', summary: '요약1', url: 'http://...', publishedAt: new Date(), source: '출처1' },
        { title: '뉴스2', summary: '요약2', url: 'http://...', publishedAt: new Date(), source: '출처2' },
        { title: '뉴스3', summary: '요약3', url: 'http://...', publishedAt: new Date(), source: '출처3' },
      ];

      const generator = new ScriptGenerator();
      const result = await generator.generateScript(mockNews);

      expect(result.success).toBe(true);
      expect(result.sections.hook).toBeTruthy();
      expect(result.sections.problem).toBeTruthy();
      expect(result.sections.impact).toBeTruthy();
      expect(result.sections.conclusion).toBeTruthy();
      expect(result.metadata.newsCount).toBe(3);
    });

    it('should throw error for invalid news count', async () => {
      const mockNews: NewsItem[] = []; // 0개

      const generator = new ScriptGenerator();
      await expect(generator.generateScript(mockNews)).rejects.toThrow('Invalid news count');
    });
  });
});
```

**Acceptance Criteria**:

- Gemini API 호출이 10초 이내 완료
- 3-5개 뉴스로 스크립트 생성
- 4단계 구조 정확히 추출
- 에러 핸들링 동작 (재시도, fallback)
- 테스트 커버리지 85% 이상

---

### Phase 4: Validator & Quality Control (Week 4) - 검증 및 품질 관리

#### Task 4.1: Validator 클래스 생성

- [x] `validator.ts` 파일 작성
- [x] `validateScript(scriptResult: ScriptResult): ValidationResult` 메서드 추가

**Implementation Pattern**:

```typescript
export class ScriptValidator {
  validateScript(scriptResult: ScriptResult): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 구조 검증
    const structureCheck = this.checkStructure(scriptResult.sections);
    errors.push(...structureCheck.errors);
    warnings.push(...structureCheck.warnings);

    // 품질 검증
    const qualityCheck = this.checkQuality(scriptResult);
    errors.push(...qualityCheck.errors);
    warnings.push(...qualityCheck.warnings);

    // 점수 계산
    const score = this.calculateScore(structureCheck, qualityCheck);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score,
    };
  }
}
```

---

#### Task 4.2: 구조 검증 구현

- [x] 4개 섹션 존재 확인:
  - `hook`, `problem`, `impact`, `conclusion` 모두 필수
  - 빈 문자열 체크
- [x] 섹션별 길이 검증:
  - Hook: 10-30자 (권장)
  - 문제: 50-100자 (권장)
  - 영향: 100-150자 (권장)
  - 결론: 20-50자 (권장)
- [x] 전체 길이 검증:
  - 최소: 180자
  - 최대: 270자
  - 권장: 200-250자

**Implementation**:

```typescript
private checkStructure(sections: ScriptSections): StructureCheck {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 섹션 존재 확인
  if (!sections.hook || sections.hook.trim().length === 0) {
    errors.push('Hook 섹션이 비어있습니다');
  }
  if (!sections.problem || sections.problem.trim().length === 0) {
    errors.push('문제 섹션이 비어있습니다');
  }
  if (!sections.impact || sections.impact.trim().length === 0) {
    errors.push('영향 섹션이 비어있습니다');
  }
  if (!sections.conclusion || sections.conclusion.trim().length === 0) {
    errors.push('결론 섹션이 비어있습니다');
  }

  // 섹션 길이 검증
  const hookLength = sections.hook?.length ?? 0;
  if (hookLength < 10 || hookLength > 30) {
    warnings.push(`Hook 길이가 권장 범위를 벗어남 (현재: ${hookLength}자, 권장: 10-30자)`);
  }

  const problemLength = sections.problem?.length ?? 0;
  if (problemLength < 50 || problemLength > 100) {
    warnings.push(`문제 길이가 권장 범위를 벗어남 (현재: ${problemLength}자, 권장: 50-100자)`);
  }

  const impactLength = sections.impact?.length ?? 0;
  if (impactLength < 100 || impactLength > 150) {
    warnings.push(`영향 길이가 권장 범위를 벗어남 (현재: ${impactLength}자, 권장: 100-150자)`);
  }

  const conclusionLength = sections.conclusion?.length ?? 0;
  if (conclusionLength < 20 || conclusionLength > 50) {
    warnings.push(`결론 길이가 권장 범위를 벗어남 (현재: ${conclusionLength}자, 권장: 20-50자)`);
  }

  return { errors, warnings };
}
```

---

#### Task 4.3: 품질 검증 구현

- [x] Hook 효과성 검증:
  - 숫자 포함 확인 (`/\d+/`)
  - 감정 트리거 확인 (`급락`, `위험`, `기회` 등)
  - 직접 호명 확인 (`당신의`, `내 지갑` 등)
- [x] CTA 존재 확인:
  - 행동 동사 확인 (`확인하세요`, `준비하세요`, `얘기해보세요`)
  - 긴급성 표현 확인 (`지금`, `내일`, `즉시`)

**Implementation**:

```typescript
private checkQuality(scriptResult: ScriptResult): QualityCheck {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { sections, metadata } = scriptResult;

  // 전체 길이 검증
  const totalLength = metadata.characterCount;
  if (totalLength < 180) {
    errors.push(`전체 길이가 너무 짧습니다 (현재: ${totalLength}자, 최소: 180자)`);
  } else if (totalLength > 270) {
    errors.push(`전체 길이가 너무 깁니다 (현재: ${totalLength}자, 최대: 270자)`);
  }

  // Hook 효과성 검증
  const hookChecks = this.checkHookEffectiveness(sections.hook);
  if (!hookChecks.hasNumbers) {
    warnings.push('Hook에 숫자가 없습니다 (충격적 사실 강화 권장)');
  }
  if (!hookChecks.hasEmotion) {
    warnings.push('Hook에 감정 트리거가 없습니다 (급락, 위험, 기회 등 권장)');
  }
  if (!hookChecks.hasDirectAddress) {
    warnings.push('Hook에 직접 호명이 없습니다 (당신의, 내 지갑 등 권장)');
  }

  // CTA 검증
  const ctaCheck = this.checkCTA(sections.conclusion);
  if (!ctaCheck.hasActionVerb) {
    errors.push('결론에 행동 동사가 없습니다 (CTA 필수)');
  }
  if (!ctaCheck.hasUrgency) {
    warnings.push('결론에 긴급성 표현이 없습니다 (지금, 내일 등 권장)');
  }

  return { errors, warnings };
}

private checkHookEffectiveness(hook: string): {
  hasNumbers: boolean;
  hasEmotion: boolean;
  hasDirectAddress: boolean;
} {
  const hasNumbers = /\d+/.test(hook);
  const hasEmotion = /(급락|급등|위험|기회|충격|폭등|폭락|긴급|경고)/i.test(hook);
  const hasDirectAddress = /(당신|내|우리|여러분)/i.test(hook);

  return { hasNumbers, hasEmotion, hasDirectAddress };
}

private checkCTA(conclusion: string): {
  hasActionVerb: boolean;
  hasUrgency: boolean;
} {
  const hasActionVerb = /(확인|준비|체크|얘기|공유|저장|기억|주목)/i.test(conclusion);
  const hasUrgency = /(지금|내일|즉시|빨리|서둘러|곧)/i.test(conclusion);

  return { hasActionVerb, hasUrgency };
}
```

---

#### Task 4.4: 품질 점수 계산

- [x] 점수 계산 알고리즘 구현 (0-100):
  - 구조 완결성: 30점 (각 섹션 존재 여부)
  - 길이 정확성: 20점 (180-270자 범위)
  - Hook 품질: 25점 (숫자, 감정, 직접 호명)
  - 영향 관련성: 15점 (개인 관련성 표현)
  - CTA 강도: 10점 (행동 동사, 긴급성)
- [x] 낮은 점수에 대한 경고 추가 (< 70)
- [x] 심각한 문제에 대한 에러 추가 (< 50)

**Implementation**:

```typescript
private calculateScore(structureCheck: StructureCheck, qualityCheck: QualityCheck): number {
  let score = 100;

  // 구조 에러: -30점
  score -= structureCheck.errors.length * 30;

  // 품질 에러: -20점
  score -= qualityCheck.errors.length * 20;

  // 구조 경고: -5점
  score -= structureCheck.warnings.length * 5;

  // 품질 경고: -5점
  score -= qualityCheck.warnings.length * 5;

  return Math.max(0, score); // 최소 0점
}
```

---

#### Task 4.5: Validator 테스트 작성

- [x] `__test__/validator.unit.test.ts` 생성
- [x] 테스트 시나리오:
  - 유효한 스크립트 (모든 섹션, 좋은 품질)
  - 누락된 섹션 (hook, problem 등)
  - 너무 짧은 스크립트 (< 150자)
  - 너무 긴 스크립트 (> 300자)
  - 약한 Hook (숫자 없음, 감정 없음)
  - CTA 누락
  - 품질 점수 계산 정확성

**Test Example**:

```typescript
describe('ScriptValidator', () => {
  describe('validateScript', () => {
    it('should pass validation for valid script', () => {
      const validScript: ScriptResult = {
        success: true,
        script: '삼성전자 주가 -5% 급락! 엔비디아가 어제...',
        sections: {
          hook: '삼성전자 주가 -5% 급락!',
          problem: '엔비디아가 어제 신제품 발표를 하면서...',
          impact: '이게 당신 월급과 무슨 관계냐면...',
          conclusion: '내일 출근해서 동료한테 얘기해보세요',
        },
        metadata: {
          estimatedDuration: 45,
          characterCount: 215,
          newsCount: 3,
          generatedAt: new Date(),
          processingTime: 3200,
        },
        validation: { isValid: true, errors: [], warnings: [], score: 0 },
      };

      const validator = new ScriptValidator();
      const result = validator.validateScript(validScript);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.score).toBeGreaterThan(70);
    });

    it('should fail validation for missing hook', () => {
      const invalidScript: ScriptResult = {
        // ... (hook이 빈 문자열)
        sections: {
          hook: '',
          problem: '...',
          impact: '...',
          conclusion: '...',
        },
        // ...
      };

      const validator = new ScriptValidator();
      const result = validator.validateScript(invalidScript);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Hook 섹션이 비어있습니다');
    });
  });
});
```

**Acceptance Criteria**:

- Validator가 모든 구조적 문제 감지
- 품질 점수가 정확히 계산됨
- 테스트 커버리지 90% 이상

---

### Phase 5: Integration & Testing (Week 5) - 통합 및 테스트

#### Task 5.1: News Collector와 통합

- [ ] `src/scheduler/daily-job.ts`에 통합 예시 추가 (주석 처리):
  ```typescript
  // Example integration (commented out)
  // import { GoogleNewsService } from '@/modules/news-collector/google-news/service.js';
  // import { ScriptGenerator } from '@/modules/script-generator/index.js';
  //
  // const newsService = new GoogleNewsService();
  // const scriptGenerator = new ScriptGenerator();
  //
  // const newsResult = await newsService.collectNews(startTime, endTime);
  // if (newsResult.success && newsResult.newsItems.length >= 3) {
  //   const scriptResult = await scriptGenerator.generateScript(newsResult.newsItems.slice(0, 5));
  //   console.log('Script generated:', scriptResult.script);
  // }
  ```
- [ ] 엔드투엔드 플로우 테스트:
  1. News collector가 3-5개 반환
  2. Script generator가 입력 받음
  3. 5초 이내 스크립트 생성
  4. 검증 통과
- [ ] 엣지 케이스 처리:
  - News collector가 0개 반환
  - News collector가 5개 이상 반환 (상위 5개만 선택)
  - Gemini API 다운 (에러 처리)

---

#### Task 5.2: 통합 테스트 작성

- [ ] `tests/integration/script-generator.test.ts` 생성
- [ ] 실제 Gemini API를 사용한 전체 파이프라인 테스트 (API 키 있을 경우)
- [ ] Mock 뉴스 아이템으로 테스트 (3개, 5개)
- [ ] 엔드투엔드 성능 측정 (목표: < 6초)

**Integration Test Example**:

```typescript
describe('Script Generator Integration', () => {
  it('should generate script from news collector output', async () => {
    // Mock news collector result
    const mockNewsResult: CollectionResult = {
      success: true,
      newsItems: [
        // 3-5개 뉴스 아이템
      ],
      totalCollected: 3,
      duplicatesRemoved: 0,
      source: 'GOOGLE_NEWS',
      timestamp: new Date(),
    };

    const scriptGenerator = new ScriptGenerator();
    const startTime = Date.now();

    const scriptResult = await scriptGenerator.generateScript(mockNewsResult.newsItems);

    const duration = Date.now() - startTime;

    expect(scriptResult.success).toBe(true);
    expect(scriptResult.validation.isValid).toBe(true);
    expect(duration).toBeLessThan(6000); // 6초 이내
  });
});
```

---

#### Task 5.3: 환경 설정 추가

- [ ] `src/config/script-generator.ts` 생성:
  ```typescript
  export const SCRIPT_GENERATOR_CONFIG = {
    DEFAULT_TEMPERATURE: 0.7,
    MAX_RETRIES: 2,
    TIMEOUT_MS: 5000,
    TARGET_CHARACTER_RANGE: [180, 270] as const,
    MIN_QUALITY_SCORE: 70,
  };
  ```
- [ ] Generator가 config 사용하도록 업데이트
- [ ] 환경 변수 오버라이드 추가:
  ```
  SCRIPT_GENERATOR_TEMPERATURE=0.7
  SCRIPT_GENERATOR_TIMEOUT=5000
  ```

---

#### Task 5.4: 문서 작성

- [ ] `docs/plan/script-generator-implementation.md` 업데이트 (본 문서)
- [ ] 모든 public 메서드에 JSDoc 주석 추가
- [ ] README에 사용 예시 추가:

  ```typescript
  import { ScriptGenerator } from '@/modules/script-generator/index.js';

  const generator = new ScriptGenerator();
  const result = await generator.generateScript(newsItems);

  if (result.success && result.validation.isValid) {
    console.log('Generated script:', result.script);
    console.log('Quality score:', result.validation.score);
  }
  ```

- [ ] 프롬프트 템플릿 문서화

**Acceptance Criteria**:

- 통합 테스트 통과
- 성능 < 6초 (엔드투엔드)
- 설정 외부화 완료
- 문서 완성

---

### Phase 6: Optimization & Finalization (Week 6) - 최적화 및 완료

#### Task 6.1: 성능 최적화

- [ ] Gemini API 호출 시간 프로파일링
- [ ] 프롬프트 길이 최적화 (토큰 수 감소)
- [ ] 캐싱 추가 (optional): 동일 뉴스 반복 요청 방지
- [ ] 5초 목표 대비 벤치마크

**Optimization Ideas**:

- 프롬프트에서 불필요한 설명 제거
- 뉴스 본문을 800자로 제한 (이미 noise-remover에서 처리)
- Gemini 모델 선택 최적화 (flash vs pro)

---

#### Task 6.2: 에러 핸들링 강화

- [ ] 구체적인 에러 타입 추가:

  ```typescript
  export class GeminiTimeoutError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'GeminiTimeoutError';
    }
  }

  export class InvalidNewsInputError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'InvalidNewsInputError';
    }
  }

  export class ValidationFailedError extends Error {
    constructor(
      message: string,
      public validationResult: ValidationResult
    ) {
      super(message);
      this.name = 'ValidationFailedError';
    }
  }
  ```

- [ ] 사용자 친화적 에러 메시지 개선
- [ ] 에러 복구 전략 추가

---

#### Task 6.3: 메트릭 및 모니터링 추가

- [ ] 생성 성공률 로깅
- [ ] 평균 처리 시간 로깅
- [ ] 품질 점수 분포 로깅
- [ ] 메트릭 대시보드 (optional, Phase 2)

**Logging Example**:

```typescript
console.log(`[Metrics] 스크립트 생성 성공 (점수: ${score}/100, 시간: ${duration}ms)`);
console.log(`[Metrics] 평균 캐릭터 수: ${characterCount}, 예상 시간: ${estimatedDuration}초`);
```

---

#### Task 6.4: 최종 테스트

- [ ] 전체 테스트 스위트 실행 (`pnpm test`)
- [ ] 남은 버그 수정
- [ ] 모든 Acceptance Criteria 충족 확인
- [ ] 코드 리뷰 및 리팩토링

**Final Checklist**:

- [ ] 모든 유닛 테스트 통과
- [ ] 모든 통합 테스트 통과
- [ ] ESLint 에러 없음 (`pnpm lint`)
- [ ] Prettier 포맷 적용 (`pnpm format`)
- [ ] 성능 목표 달성 (< 5s)
- [ ] 에러 핸들링 견고함
- [ ] 코드 품질 높음

**Acceptance Criteria**:

- 모든 테스트 통과 (unit + integration)
- 성능 목표 달성 (< 5s)
- 에러 핸들링 견고
- 코드 품질 높음 (ESLint, Prettier)

---

## Acceptance Criteria (FR-002)

### Functional Requirements

- [ ] **FR-002-01**: 3-5개 필터링된 뉴스 아이템 입력 받기
- [ ] **FR-002-02**: 45초 분량 4단계 구조 스크립트 생성
- [ ] **FR-002-03**: Gemini API 사용하여 스크립트 생성
- [ ] **FR-002-04**: 스크립트 구조 및 품질 검증
- [ ] **FR-002-05**: ScriptResult 메타데이터와 함께 반환

### Performance Requirements

- [ ] **NFR-PERF-02**: Gemini API 호출 5초 이내 완료
- [ ] **Total Processing**: 전체 처리 6초 이내 (검증 포함)

### Quality Requirements

- [ ] **Script Structure**: 4개 섹션 모두 존재 (hook, problem, impact, conclusion)
- [ ] **Character Count**: 180-270자 (한국어 기준)
- [ ] **Hook Effectiveness**: 숫자 또는 충격적 사실 포함
- [ ] **CTA Presence**: 결론에 명확한 행동 유도
- [ ] **Quality Score**: 평균 점수 70점 이상

### Testing Requirements

- [ ] **Unit Test Coverage**: 핵심 모듈 90% 이상
- [ ] **Integration Test**: 엔드투엔드 파이프라인 통과
- [ ] **Performance Test**: 일관되게 6초 이내

### Code Quality Requirements

- [ ] **ESLint**: 에러 없음, 경고 없음
- [ ] **Prettier**: 코드 포맷 올바름
- [ ] **TypeScript**: Strict 모드, `any` 타입 없음
- [ ] **Documentation**: 모든 public 메서드에 JSDoc 주석

---

## Dependencies

### External Dependencies

**Required**:

- ✅ Gemini API (`@/utils/gemini.js` - 이미 구현됨)
- ✅ Gemini API Key (환경 변수 `GEMINI_API_KEY`)

**Optional (Phase 2)**:

- ❌ Database for script storage
- ❌ Redis for caching

### Internal Dependencies

**Input from**:

- ✅ news-collector module (`NewsItem[]` 제공)
- ✅ types.ts (`NewsItem` 인터페이스)

**Output to**:

- ❌ video-generator module (HeyGen) - Phase 2
- ❌ logger module (analytics용) - Phase 2

### Development Dependencies

**Already Installed**:

- ✅ TypeScript 5.9.3
- ✅ Zod 4.2.1
- ✅ Jest 30.2.0
- ✅ ESLint + Prettier

---

## Technical Specifications

### Gemini API Configuration

```typescript
// 스크립트 생성용 권장 설정
const GEMINI_CONFIG = {
  model: 'gemini-3-flash-preview', // 빠르고 비용 효율적
  temperature: 0.7, // 창의적이지만 일관성 유지
  maxOutputTokens: 500, // 한국어 ~300단어
  timeout: 5000, // 5초 (NFR-PERF-02)
};
```

### Character Count Guidelines

**한국어 특성**:

- 평균 말하기 속도: 4-5자/초
- 45초 ≈ 180-225자 (이상적)
- 범위: 180-270자 (허용)

**섹션별 분배**:

- Hook: 10-30자 (3초)
- 문제: 50-100자 (12초)
- 영향: 100-150자 (25초)
- 결론: 20-50자 (5초)

---

## Risks & Mitigation

| Risk                  | Impact | Probability | Mitigation                                                |
| --------------------- | ------ | ----------- | --------------------------------------------------------- |
| Gemini API 타임아웃   | High   | Medium      | 5초 타임아웃, 재시도 로직 (최대 2회), exponential backoff |
| 낮은 스크립트 품질    | High   | Medium      | 품질 점수 (0-100), 70점 미만 거부, 수동 리뷰 (Phase 2)    |
| Gemini 응답 형식 변경 | Medium | Low         | JSON 구조화 출력, 응답 검증, regex fallback               |
| 캐릭터 수 불일치      | Medium | Medium      | 사전 검증, 프롬프트에 힌트 추가, 범위 벗어나면 재시도     |
| Gemini API 비용 초과  | Low    | Low         | 일일 사용량 모니터링, 월별 예산 제한, 캐싱 (Phase 2)      |

---

## Next Steps After Completion

### Phase 2: HeyGen Integration

- 생성된 스크립트를 video-generator 모듈로 전달
- HeyGen API 영상 생성 요청 처리
- 영상 완료 폴링

### Phase 3: Analytics & Improvement

- 시간별 스크립트 품질 점수 추적
- 사용자 피드백 수집 (수동 리뷰)
- 다양한 프롬프트 템플릿 A/B 테스트
- 더 높은 참여도를 위한 최적화

### Phase 4: Advanced Features

- 다중 주제 스크립트 생성
- 동적 섹션 타이밍 (뉴스 중요도 기반)
- 개인화된 스크립트 (사용자 선호도)
- 실시간 트렌딩 토픽 감지

---

## Notes

- 기존 `news-collector` 모듈 패턴을 따라 일관성 유지
- `@/utils/gemini.js` 유틸리티 사용 (이미 구현됨)
- TypeScript ESM 호환성 확보 (import에 `.js` 확장자 필수)
- 구현 전 테스트 작성 (TDD 접근 권장)
- 프롬프트 템플릿을 별도 파일에 보관 (A/B 테스트 용이)
- 개발 중 Gemini API 비용 모니터링

---

**마지막 업데이트**: 2026-01-08
**다음 리뷰**: Week 1 완료 후
