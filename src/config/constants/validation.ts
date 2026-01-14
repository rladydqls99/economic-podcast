/**
 * Validation Keywords and Scoring Constants
 *
 * Configurable keywords for script quality validation.
 * Centralizes viral content markers and scoring weights.
 *
 * @module config/constants/validation
 */

/**
 * Keywords for validating viral content effectiveness
 */
export const VALIDATION_KEYWORDS = {
  /**
   * Emotional trigger words for Hook effectiveness
   * Examples: 급락 (plunge), 폭등 (surge), 충격 (shock)
   */
  EMOTION_TRIGGERS: ['급락', '급등', '위험', '기회', '충격', '폭등', '폭락', '긴급', '경고'],

  /**
   * Direct address words for personal connection
   * Examples: 당신 (you), 내 (my), 우리 (we)
   */
  DIRECT_ADDRESS: ['당신', '내', '우리', '여러분'],

  /**
   * Action verbs for CTA effectiveness
   * Examples: 확인 (check), 준비 (prepare), 공유 (share)
   */
  ACTION_VERBS: ['확인', '준비', '체크', '얘기', '공유', '저장', '기억', '주목'],

  /**
   * Urgency expressions for CTA strength
   * Examples: 지금 (now), 즉시 (immediately)
   */
  URGENCY_WORDS: ['지금', '내일', '즉시', '빨리', '서둘러', '곧'],
} as const;

/**
 * Score penalties for validation issues
 *
 * Used to calculate quality score (0-100).
 * Higher penalties indicate more serious issues.
 */
export const VALIDATION_SCORES = {
  /** Penalty for missing or empty section (critical) */
  STRUCTURE_ERROR_PENALTY: 30,

  /** Penalty for quality violations (length, missing CTA) */
  QUALITY_ERROR_PENALTY: 20,

  /** Penalty for warnings (recommendations) */
  WARNING_PENALTY: 5,

  /** Maximum possible score */
  MAX_SCORE: 100,

  /** Minimum possible score */
  MIN_SCORE: 0,
} as const;

/**
 * Type helpers for validation keywords
 */
export type EmotionTrigger = (typeof VALIDATION_KEYWORDS.EMOTION_TRIGGERS)[number];
export type DirectAddress = (typeof VALIDATION_KEYWORDS.DIRECT_ADDRESS)[number];
export type ActionVerb = (typeof VALIDATION_KEYWORDS.ACTION_VERBS)[number];
export type UrgencyWord = (typeof VALIDATION_KEYWORDS.URGENCY_WORDS)[number];
