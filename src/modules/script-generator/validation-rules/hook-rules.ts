/**
 * Hook Validation Rules
 *
 * Configurable validation rules for Hook section effectiveness.
 *
 * @module script-generator/validation-rules/hook-rules
 */

import { VALIDATION_KEYWORDS } from '@/config/constants/validation.js';

/**
 * Hook effectiveness check result
 */
export interface HookCheckResult {
  /** Whether hook contains numbers (shock value) */
  hasNumbers: boolean;

  /** Whether hook has emotional trigger words */
  hasEmotion: boolean;

  /** Whether hook directly addresses the viewer */
  hasDirectAddress: boolean;
}

/**
 * Check Hook effectiveness for viral content
 *
 * Validates that the Hook section follows viral content principles:
 * - Contains specific numbers for shock value
 * - Uses emotional trigger words (급락, 위험, 기회, etc.)
 * - Directly addresses the viewer (당신, 내, 우리, etc.)
 *
 * @param hook - Hook section text
 * @returns Hook effectiveness indicators
 *
 * @example
 * ```typescript
 * const result = checkHookEffectiveness('삼성전자 주가 -5% 급락!');
 * // { hasNumbers: true, hasEmotion: true, hasDirectAddress: false }
 * ```
 */
export function checkHookEffectiveness(hook: string): HookCheckResult {
  const emotionPattern = new RegExp(`(${VALIDATION_KEYWORDS.EMOTION_TRIGGERS.join('|')})`, 'i');
  const addressPattern = new RegExp(`(${VALIDATION_KEYWORDS.DIRECT_ADDRESS.join('|')})`, 'i');

  return {
    hasNumbers: /\d+/.test(hook),
    hasEmotion: emotionPattern.test(hook),
    hasDirectAddress: addressPattern.test(hook),
  };
}

/**
 * Generate warnings for Hook issues
 *
 * @param hookCheck - Hook check result
 * @returns Array of warning messages
 */
export function getHookWarnings(hookCheck: HookCheckResult): string[] {
  const warnings: string[] = [];

  if (!hookCheck.hasNumbers) {
    warnings.push('Hook에 숫자가 없습니다 (충격적 사실 강화 권장)');
  }
  if (!hookCheck.hasEmotion) {
    warnings.push('Hook에 감정 트리거가 없습니다 (급락, 위험, 기회 등 권장)');
  }
  if (!hookCheck.hasDirectAddress) {
    warnings.push('Hook에 직접 호명이 없습니다 (당신의, 내 지갑 등 권장)');
  }

  return warnings;
}
