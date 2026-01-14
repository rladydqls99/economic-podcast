/**
 * CTA (Call-to-Action) Validation Rules
 *
 * Configurable validation rules for conclusion section CTA effectiveness.
 *
 * @module script-generator/validation-rules/cta-rules
 */

import { VALIDATION_KEYWORDS } from '@/config/constants/validation.js';

/**
 * CTA check result
 */
export interface CTACheckResult {
  /** Whether conclusion has action verbs */
  hasActionVerb: boolean;

  /** Whether conclusion has urgency expressions */
  hasUrgency: boolean;
}

/**
 * Check CTA (Call-to-Action) effectiveness
 *
 * Validates that the conclusion section has strong CTA:
 * - Contains action verbs (확인, 준비, 공유, etc.)
 * - Uses urgency expressions (지금, 내일, 즉시, etc.)
 *
 * @param conclusion - Conclusion section text
 * @returns CTA strength indicators
 *
 * @example
 * ```typescript
 * const result = checkCTA('지금 바로 동료에게 공유하세요!');
 * // { hasActionVerb: true, hasUrgency: true }
 * ```
 */
export function checkCTA(conclusion: string): CTACheckResult {
  const actionPattern = new RegExp(`(${VALIDATION_KEYWORDS.ACTION_VERBS.join('|')})`, 'i');
  const urgencyPattern = new RegExp(`(${VALIDATION_KEYWORDS.URGENCY_WORDS.join('|')})`, 'i');

  return {
    hasActionVerb: actionPattern.test(conclusion),
    hasUrgency: urgencyPattern.test(conclusion),
  };
}

/**
 * Generate errors and warnings for CTA issues
 *
 * @param ctaCheck - CTA check result
 * @returns Object with errors and warnings arrays
 */
export function getCTAIssues(ctaCheck: CTACheckResult): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!ctaCheck.hasActionVerb) {
    errors.push('결론에 행동 동사가 없습니다 (CTA 필수)');
  }
  if (!ctaCheck.hasUrgency) {
    warnings.push('결론에 긴급성 표현이 없습니다 (지금, 내일 등 권장)');
  }

  return { errors, warnings };
}
