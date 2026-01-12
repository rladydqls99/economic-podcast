/**
 * Script Generator Core
 *
 * Orchestrates script generation workflow using Gemini API.
 * Generates 45-second viral shorts scripts from economic news.
 *
 * @module script-generator/generator
 */

import { chatJSON } from '@/utils/gemini.js';
import { NewsItem } from '@/modules/news-collector/types.js';
import { PromptBuilder } from './prompt-builder.js';
import { ScriptValidator } from './validator.js';
import { ScriptResult, ScriptSections, ScriptGeneratorConfig, ScriptMetadata } from './types.js';

/**
 * ScriptGenerator
 *
 * Main service class for generating podcast scripts from economic news.
 * Uses Gemini API with retry logic and comprehensive error handling.
 *
 * @example
 * ```typescript
 * const generator = new ScriptGenerator({ temperature: 0.7 });
 * const result = await generator.generateScript(newsItems);
 * console.log(result.script);
 * ```
 */
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

  /**
   * Generate Script
   *
   * Orchestrates the full script generation workflow:
   * 1. Input validation
   * 2. Prompt generation
   * 3. Gemini API call (with retry)
   * 4. Response parsing
   * 5. Metadata calculation
   * 6. Script validation
   *
   * @param newsItems - Array of news items (3-5 items required)
   * @returns Complete script result with sections, metadata, and validation
   *
   * @throws {Error} If newsItems count is invalid (< 3 or > 5)
   * @throws {Error} If Gemini API call fails after retries
   */
  async generateScript(newsItems: NewsItem[]): Promise<ScriptResult> {
    const startTime = Date.now();

    console.log(`[ScriptGenerator] 스크립트 생성 시작 (뉴스 ${newsItems.length}개)`);
    console.log(`[ScriptGenerator] 뉴스 제목: ${newsItems.map((n) => n.title).join(', ')}`);

    // 입력 검증
    this.validateInput(newsItems);

    // 프롬프트 생성
    const prompt = this.promptBuilder.buildScriptPrompt(newsItems);

    // Gemini API 호출 (재시도 로직 포함)
    const sections = await this.callGeminiAPI(prompt);

    // 메타데이터 계산
    const metadata = this.calculateMetadata(sections, newsItems.length, startTime);

    console.log(`[ScriptGenerator] 생성 완료: ${metadata.characterCount}자, 예상 ${metadata.estimatedDuration}초`);
    console.log(`[ScriptGenerator] 처리 시간: ${metadata.processingTime}ms`);

    // 스크립트 결과 구성
    const scriptResult: ScriptResult = {
      success: true,
      script: this.combineSections(sections),
      sections,
      metadata,
      validation: { isValid: true, errors: [], warnings: [], score: 0 }, // 임시값
    };

    // 검증 (Phase 4에서 완전 구현)
    const validation = this.validator.validateScript(scriptResult);
    scriptResult.validation = validation;

    console.log(`[ScriptGenerator] 검증 점수: ${validation.score}/100`);

    return scriptResult;
  }

  /**
   * Validate Input
   *
   * Validates that newsItems array meets requirements.
   *
   * @param newsItems - News items to validate
   * @throws {Error} If count is invalid
   * @private
   */
  private validateInput(newsItems: NewsItem[]): void {
    if (newsItems.length < 3 || newsItems.length > 5) {
      throw new Error(`Invalid news count: ${newsItems.length} (expected 3-5)`);
    }
  }

  /**
   * Call Gemini API
   *
   * Calls Gemini API with retry logic and exponential backoff.
   * Retries up to 2 times with 1s, 2s delays.
   *
   * @param prompt - Complete prompt string
   * @returns Parsed script sections
   * @throws {Error} If all retry attempts fail
   * @private
   */
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

  /**
   * Calculate Metadata
   *
   * Calculates script metadata including duration, character count, and processing time.
   *
   * @param sections - Script sections
   * @param newsCount - Number of news items used
   * @param startTime - Generation start timestamp
   * @returns Script metadata
   * @private
   */
  private calculateMetadata(sections: ScriptSections, newsCount: number, startTime: number): ScriptMetadata {
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

  /**
   * Combine Sections
   *
   * Combines all script sections into a single text string.
   *
   * @param sections - Script sections
   * @returns Combined script text
   * @private
   */
  private combineSections(sections: ScriptSections): string {
    return [sections.hook, sections.problem, sections.impact, sections.conclusion]
      .filter((section) => section && section.trim().length > 0)
      .join(' ');
  }

  /**
   * Sleep
   *
   * Utility method for async delays (used in retry backoff).
   *
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after delay
   * @private
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
