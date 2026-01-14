/**
 * Async Queue for Concurrency Control
 *
 * Event-driven queue for limiting concurrent operations.
 * Replaces busy-wait patterns with efficient Promise-based waiting.
 *
 * @module utils/async-queue
 */

/**
 * Async Queue
 *
 * Controls concurrent access to a limited resource pool.
 * Uses Promise-based waiting instead of polling.
 *
 * @example
 * ```typescript
 * const queue = new AsyncQueue(5); // Max 5 concurrent operations
 *
 * async function doWork() {
 *   await queue.acquire();
 *   try {
 *     await performOperation();
 *   } finally {
 *     queue.release();
 *   }
 * }
 * ```
 */
export class AsyncQueue {
  private waitingQueue: (() => void)[] = [];
  private activeCount = 0;

  /**
   * Create a new AsyncQueue
   *
   * @param maxConcurrent - Maximum number of concurrent slots
   */
  constructor(private readonly maxConcurrent: number) {
    if (maxConcurrent < 1) {
      throw new Error('maxConcurrent must be at least 1');
    }
  }

  /**
   * Acquire a slot from the queue
   *
   * Resolves immediately if a slot is available.
   * Otherwise, waits until a slot is released.
   */
  async acquire(): Promise<void> {
    if (this.activeCount < this.maxConcurrent) {
      this.activeCount++;
      return;
    }

    // Wait for a slot to become available
    return new Promise<void>((resolve) => {
      this.waitingQueue.push(() => {
        this.activeCount++;
        resolve();
      });
    });
  }

  /**
   * Release a slot back to the queue
   *
   * If there are waiting requests, the next one is immediately activated.
   */
  release(): void {
    this.activeCount--;

    // Activate next waiting request if any
    const next = this.waitingQueue.shift();
    if (next) {
      next();
    }
  }

  /**
   * Get current number of active slots
   */
  getActiveCount(): number {
    return this.activeCount;
  }

  /**
   * Get number of requests waiting for a slot
   */
  getWaitingCount(): number {
    return this.waitingQueue.length;
  }

  /**
   * Get maximum concurrent slots
   */
  getMaxConcurrent(): number {
    return this.maxConcurrent;
  }
}
