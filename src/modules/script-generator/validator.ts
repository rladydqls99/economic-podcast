/**
 * Script Validator (Phase 4: Quality Control)
 *
 * Validates generated scripts for quality and compliance with viral principles.
 * Checks structure, length constraints, Hook effectiveness, and CTA strength.
 *
 * @module script-generator/validator
 */

import { ScriptResult, ValidationResult, ScriptSections } from './types.js';
import { LENGTH_CONSTRAINTS } from '@/config/constants/script-generation.js';
import { VALIDATION_SCORES } from '@/config/constants/validation.js';
import { checkHookEffectiveness, getHookWarnings } from './validation-rules/hook-rules.js';
import { checkCTA, getCTAIssues } from './validation-rules/cta-rules.js';

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

    // 섹션 길이 검증 (권장 범위 - 상수 사용)
    const hookLength = sections.hook?.length ?? 0;
    if (hookLength < LENGTH_CONSTRAINTS.HOOK.min || hookLength > LENGTH_CONSTRAINTS.HOOK.max) {
      warnings.push(
        `Hook 길이가 권장 범위를 벗어남 (현재: ${hookLength}자, 권장: ${LENGTH_CONSTRAINTS.HOOK.min}-${LENGTH_CONSTRAINTS.HOOK.max}자)`
      );
    }

    const problemLength = sections.problem?.length ?? 0;
    if (problemLength < LENGTH_CONSTRAINTS.PROBLEM.min || problemLength > LENGTH_CONSTRAINTS.PROBLEM.max) {
      warnings.push(
        `문제 길이가 권장 범위를 벗어남 (현재: ${problemLength}자, 권장: ${LENGTH_CONSTRAINTS.PROBLEM.min}-${LENGTH_CONSTRAINTS.PROBLEM.max}자)`
      );
    }

    const impactLength = sections.impact?.length ?? 0;
    if (impactLength < LENGTH_CONSTRAINTS.IMPACT.min || impactLength > LENGTH_CONSTRAINTS.IMPACT.max) {
      warnings.push(
        `영향 길이가 권장 범위를 벗어남 (현재: ${impactLength}자, 권장: ${LENGTH_CONSTRAINTS.IMPACT.min}-${LENGTH_CONSTRAINTS.IMPACT.max}자)`
      );
    }

    const conclusionLength = sections.conclusion?.length ?? 0;
    if (conclusionLength < LENGTH_CONSTRAINTS.CONCLUSION.min || conclusionLength > LENGTH_CONSTRAINTS.CONCLUSION.max) {
      warnings.push(
        `결론 길이가 권장 범위를 벗어남 (현재: ${conclusionLength}자, 권장: ${LENGTH_CONSTRAINTS.CONCLUSION.min}-${LENGTH_CONSTRAINTS.CONCLUSION.max}자)`
      );
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

    // 전체 길이 검증 (필수 - 상수 사용)
    const totalLength = metadata.characterCount;
    if (totalLength < LENGTH_CONSTRAINTS.TOTAL.min) {
      errors.push(`전체 길이가 너무 짧습니다 (현재: ${totalLength}자, 최소: ${LENGTH_CONSTRAINTS.TOTAL.min}자)`);
    } else if (totalLength > LENGTH_CONSTRAINTS.TOTAL.max) {
      errors.push(`전체 길이가 너무 깁니다 (현재: ${totalLength}자, 최대: ${LENGTH_CONSTRAINTS.TOTAL.max}자)`);
    }

    // Hook 효과성 검증 (추출된 함수 사용)
    const hookCheck = checkHookEffectiveness(sections.hook);
    warnings.push(...getHookWarnings(hookCheck));

    // CTA 검증 (추출된 함수 사용)
    const ctaCheck = checkCTA(sections.conclusion);
    const ctaIssues = getCTAIssues(ctaCheck);
    errors.push(...ctaIssues.errors);
    warnings.push(...ctaIssues.warnings);

    return { errors, warnings };
  }

  /**
   * Calculate Score
   *
   * Calculates quality score (0-100) based on validation results:
   * - Start at 100 points
   * - Structure error: -30 points each
   * - Quality error: -20 points each
   * - Warning: -5 points each
   * - Minimum: 0 points
   *
   * @param structureCheck - Structure validation result
   * @param qualityCheck - Quality validation result
   * @returns Quality score (0-100)
   * @private
   */
  private calculateScore(structureCheck: StructureCheck, qualityCheck: QualityCheck): number {
    let score = VALIDATION_SCORES.MAX_SCORE;

    // 구조 에러
    score -= structureCheck.errors.length * VALIDATION_SCORES.STRUCTURE_ERROR_PENALTY;

    // 품질 에러
    score -= qualityCheck.errors.length * VALIDATION_SCORES.QUALITY_ERROR_PENALTY;

    // 경고
    score -= structureCheck.warnings.length * VALIDATION_SCORES.WARNING_PENALTY;
    score -= qualityCheck.warnings.length * VALIDATION_SCORES.WARNING_PENALTY;

    return Math.max(VALIDATION_SCORES.MIN_SCORE, score);
  }
}
