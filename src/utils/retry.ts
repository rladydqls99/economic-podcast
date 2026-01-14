/**
 * Retry Utility with Exponential Backoff
 *
 * Provides a generic retry mechanism for async operations.
 * Supports configurable retry counts, backoff strategies, and callbacks.
 *
 * @module utils/retry
 */

import { IRetryConfig, IBackoffStrategy, RetryCallback } from '@/types/interfaces/retry.js';
import { RETRY_CONFIG } from '@/config/constants/timeouts.js';

/**
 * Exponential backoff strategy
 *
 * Calculates delay using: baseDelay * multiplier^attempt
 * Optionally caps at maxDelay.
 */
export class ExponentialBackoff implements IBackoffStrategy {
  constructor(private readonly config: IRetryConfig) {}

  getDelay(attempt: number): number {
    const delay = this.config.baseDelayMs * Math.pow(this.config.backoffMultiplier, attempt);
    return this.config.maxDelayMs ? Math.min(delay, this.config.maxDelayMs) : delay;
  }
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: IRetryConfig = {
  maxRetries: RETRY_CONFIG.MAX_RETRIES,
  baseDelayMs: RETRY_CONFIG.BASE_DELAY_MS,
  backoffMultiplier: RETRY_CONFIG.BACKOFF_MULTIPLIER,
};

/**
 * Execute an async function with retry logic
 *
 * @param fn - Async function to execute
 * @param config - Retry configuration (uses defaults if not provided)
 * @param onRetry - Optional callback invoked before each retry
 * @returns Promise resolving to function result
 * @throws Last error if all retries fail
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => fetchData(),
 *   { maxRetries: 3, baseDelayMs: 1000, backoffMultiplier: 2 },
 *   (attempt, error, delay) => console.log(`Retry ${attempt} after ${delay}ms: ${error.message}`)
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<IRetryConfig> = {},
  onRetry?: RetryCallback
): Promise<T> {
  const fullConfig: IRetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const backoff = new ExponentialBackoff(fullConfig);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < fullConfig.maxRetries) {
        const delay = backoff.getDelay(attempt);
        onRetry?.(attempt, lastError, delay);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Sleep utility
 *
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
