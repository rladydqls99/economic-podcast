/**
 * Timeout and Delay Constants
 *
 * Centralized timeout values used across the application.
 * Using `as const` ensures literal types for better type safety.
 *
 * @module config/constants/timeouts
 */

/**
 * Timeout values for various operations (in milliseconds)
 */
export const TIMEOUTS = {
  /** RSS feed parsing timeout (GoogleNewsCollector) */
  RSS_PARSE: 30_000,

  /** Page load timeout for Playwright (GoogleNewsExtractor) */
  PAGE_LOAD: 30_000,

  /** Wait time for dynamic content to load after page navigation */
  DYNAMIC_CONTENT_WAIT: 2_000,

  /** Delay between HTTP requests for rate limiting */
  REQUEST_DELAY: 1_000,

  /** Delay between keyword searches in GoogleNewsCollector */
  KEYWORD_FETCH_DELAY: 1_000,

  /** Poll interval for browser tab queue (deprecated, will use AsyncQueue) */
  TAB_QUEUE_POLL: 1_000,

  /** Default timeout for script generation */
  SCRIPT_GENERATION: 5_000,
} as const;

/**
 * Limit values for concurrency control
 */
export const LIMITS = {
  /** Maximum concurrent browser tabs in PlaywrightManager */
  MAX_CONCURRENT_TABS: 5,

  /** Minimum content length for valid article extraction */
  MIN_CONTENT_LENGTH: 100,

  /** Minimum news items required for script generation */
  MIN_NEWS_ITEMS: 3,

  /** Maximum news items allowed for script generation */
  MAX_NEWS_ITEMS: 5,
} as const;

/**
 * Retry configuration defaults
 */
export const RETRY_CONFIG = {
  /** Maximum number of retry attempts */
  MAX_RETRIES: 2,

  /** Base delay for exponential backoff (ms) */
  BASE_DELAY_MS: 1_000,

  /** Multiplier for exponential backoff */
  BACKOFF_MULTIPLIER: 2,
} as const;
