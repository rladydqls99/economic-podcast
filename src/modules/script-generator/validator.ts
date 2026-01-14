/**
 * Script Validator (Phase 4: Quality Control)
 *
 * Validates generated scripts for quality and compliance with viral principles.
 * Checks structure, length constraints, Hook effectiveness, and CTA strength.
 *
 * @module script-generator/validator
 */

import { ScriptResult, ValidationResult, ScriptSections } from './types.js';

/**
 * Structure Check Result
 *
 * @property errors - Critical structure errors
 * @property warnings - Non-critical structure warnings
 */
interface StructureCheck {
  errors: string[];
  warnings: string[];
}

/**
 * Quality Check Result
 *
 * @property errors - Critical quality errors
 * @property warnings - Non-critical quality warnings
 */
interface QualityCheck {
  errors: string[];
  warnings: string[];
}

/**
 * Hook Effectiveness Check
 *
 * @property hasNumbers - Whether hook contains numbers
 * @property hasEmotion - Whether hook has emotional triggers
 * @property hasDirectAddress - Whether hook directly addresses viewer
 */
interface HookCheck {
  hasNumbers: boolean;
  hasEmotion: boolean;
  hasDirectAddress: boolean;
}

/**
 * CTA Check
 *
 * @property hasActionVerb - Whether conclusion has action verbs
 * @property hasUrgency - Whether conclusion has urgency expressions
 */
interface CTACheck {
  hasActionVerb: boolean;
  hasUrgency: boolean;
}

/**
 * ScriptValidator
 *
 * Validates script quality and structure according to viral shorts principles:
 * - 4-section structure (hook, problem, impact, conclusion)
 * - Character count constraints (180-270 chars total)
 * - Section-specific length recommendations
 * - Hook effectiveness (numbers, emotion, direct address)
 * - CTA strength (action verbs, urgency)
 *
 * @example
 * ```typescript
 * const validator = new ScriptValidator();
 * const validation = validator.validateScript(scriptResult);
 * console.log(validation.score); // 0-100
 * console.log(validation.errors); // Critical issues
 * console.log(validation.warnings); // Suggestions
 * ```
 */
export class ScriptValidator {
  /**
   * Validate Script
   *
   * Orchestrates full validation workflow:
   * 1. Structure validation (sections exist, lengths)
   * 2. Quality validation (Hook, CTA, total length)
   * 3. Score calculation (0-100)
   *
   * @param scriptResult - Script result to validate
   * @returns Validation result with errors, warnings, and score
   */
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

  /**
   * Check Structure
   *
   * Validates 4-section structure and section-specific length requirements:
   * - All 4 sections must exist and be non-empty
   * - Hook: 10-30 chars (recommended)
   * - Problem: 50-100 chars (recommended)
   * - Impact: 100-150 chars (recommended)
   * - Conclusion: 20-50 chars (recommended)
   *
   * @param sections - Script sections to validate
   * @returns Structure check result with errors and warnings
   * @private
   */
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

    // 섹션 길이 검증 (권장 범위)
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

  /**
   * Check Quality
   *
   * Validates script quality factors:
   * - Total length: 180-270 chars (required)
   * - Hook effectiveness: numbers, emotion, direct address
   * - CTA strength: action verbs, urgency
   *
   * @param scriptResult - Complete script result
   * @returns Quality check result with errors and warnings
   * @private
   */
  private checkQuality(scriptResult: ScriptResult): QualityCheck {
    const errors: string[] = [];
    const warnings: string[] = [];
    const { sections, metadata } = scriptResult;

    // 전체 길이 검증 (필수)
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

  /**
   * Check Hook Effectiveness
   *
   * Validates Hook section for viral effectiveness:
   * - Numbers: /\d+/ (shock value)
   * - Emotional triggers: 급락, 급등, 위험, 기회, 충격, 폭등, 폭락, 긴급, 경고
   * - Direct address: 당신, 내, 우리, 여러분
   *
   * @param hook - Hook section text
   * @returns Hook effectiveness indicators
   * @private
   */
  private checkHookEffectiveness(hook: string): HookCheck {
    const hasNumbers = /\d+/.test(hook);
    const hasEmotion = /(급락|급등|위험|기회|충격|폭등|폭락|긴급|경고)/i.test(hook);
    const hasDirectAddress = /(당신|내|우리|여러분)/i.test(hook);

    return { hasNumbers, hasEmotion, hasDirectAddress };
  }

  /**
   * Check CTA (Call-to-Action)
   *
   * Validates conclusion section for effective CTA:
   * - Action verbs: 확인, 준비, 체크, 얘기, 공유, 저장, 기억, 주목
   * - Urgency expressions: 지금, 내일, 즉시, 빨리, 서둘러, 곧
   *
   * @param conclusion - Conclusion section text
   * @returns CTA strength indicators
   * @private
   */
  private checkCTA(conclusion: string): CTACheck {
    const hasActionVerb = /(확인|준비|체크|얘기|공유|저장|기억|주목)/i.test(conclusion);
    const hasUrgency = /(지금|내일|즉시|빨리|서둘러|곧)/i.test(conclusion);

    return { hasActionVerb, hasUrgency };
  }

  /**
   * Calculate Score
   *
   * Calculates quality score (0-100) based on validation results:
   * - Start at 100 points
   * - Structure error: -30 points each
   * - Quality error: -20 points each
   * - Structure warning: -5 points each
   * - Quality warning: -5 points each
   * - Minimum: 0 points
   *
   * @param structureCheck - Structure validation result
   * @param qualityCheck - Quality validation result
   * @returns Quality score (0-100)
   * @private
   */
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
}
