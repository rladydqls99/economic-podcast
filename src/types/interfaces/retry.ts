/**
 * Retry Configuration Interface
 *
 * Defines the configuration for retry behavior with exponential backoff.
 *
 * @module types/interfaces/retry
 */

/**
 * Configuration for retry behavior
 */
export interface IRetryConfig {
  /** Maximum number of retry attempts (0 = no retries, just one attempt) */
  maxRetries: number;

  /** Initial delay in milliseconds before first retry */
  baseDelayMs: number;

  /** Multiplier for exponential backoff (delay = baseDelay * multiplier^attempt) */
  backoffMultiplier: number;

  /** Maximum delay cap in milliseconds (optional) */
  maxDelayMs?: number;
}

/**
 * Backoff strategy interface for custom delay calculations
 */
export interface IBackoffStrategy {
  /** Calculate delay for a given attempt number (0-indexed) */
  getDelay(attempt: number): number;
}

/**
 * Callback for retry events
 */
export type RetryCallback = (attempt: number, error: Error, nextDelayMs: number) => void;
