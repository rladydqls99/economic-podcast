/**
 * Script Generation Constants
 *
 * Configuration values for the script generator module including
 * length constraints, default values, and duration calculations.
 *
 * @module config/constants/script-generation
 */

/**
 * Default configuration for ScriptGenerator
 */
export const SCRIPT_GENERATOR_DEFAULTS = {
  /** AI temperature (0.0 = deterministic, 1.0 = creative) */
  TEMPERATURE: 0.7,

  /** Maximum tokens for AI response */
  MAX_TOKENS: 500,

  /** API call timeout (ms) */
  TIMEOUT: 5_000,
} as const;

/**
 * Character count constraints for script sections
 *
 * Based on 45-second viral shorts format with ~4.5 chars/second speaking rate.
 */
export const LENGTH_CONSTRAINTS = {
  /** Total script length range */
  TOTAL: {
    min: 180,
    max: 270,
  },

  /** Hook section (0-3 seconds) - Shocking fact */
  HOOK: {
    min: 10,
    max: 30,
  },

  /** Problem section (3-15 seconds) - Background explanation */
  PROBLEM: {
    min: 50,
    max: 100,
  },

  /** Impact section (15-40 seconds) - Personal relevance */
  IMPACT: {
    min: 100,
    max: 150,
  },

  /** Conclusion section (40-45 seconds) - Call-to-action */
  CONCLUSION: {
    min: 20,
    max: 50,
  },
} as const;

/**
 * Duration calculation constants
 */
export const DURATION = {
  /** Average characters per second for Korean speech */
  CHARS_PER_SECOND_KOREAN: 4.5,

  /** Target video duration in seconds */
  TARGET_DURATION: 45,
} as const;

/**
 * News item count requirements
 */
export const NEWS_REQUIREMENTS = {
  /** Minimum news items for script generation */
  MIN_ITEMS: 3,

  /** Maximum news items for script generation */
  MAX_ITEMS: 5,
} as const;
