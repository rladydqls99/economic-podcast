/**
 * Logger Abstraction
 *
 * Provides a consistent logging interface across the application.
 * Currently wraps console methods but can be extended to use
 * structured logging libraries (Winston, Pino) in the future.
 *
 * @module utils/logger
 */

/**
 * Logger interface for dependency injection and testing
 */
export interface ILogger {
  info(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
}

/**
 * Console-based logger implementation
 *
 * @example
 * ```typescript
 * const logger = createLogger('ScriptGenerator');
 * logger.info('Script generation started', { newsCount: 5 });
 * logger.error('Generation failed', error, { attempt: 2 });
 * ```
 */
export class ConsoleLogger implements ILogger {
  constructor(private readonly prefix: string) {}

  /**
   * Log informational message
   */
  info(message: string, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    if (context) {
      console.log(`[${timestamp}] [${this.prefix}] ${message}`, context);
    } else {
      console.log(`[${timestamp}] [${this.prefix}] ${message}`);
    }
  }

  /**
   * Log error message with optional Error object
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const errorInfo = error ? { errorMessage: error.message, stack: error.stack } : {};
    const logContext = { ...errorInfo, ...context };

    if (Object.keys(logContext).length > 0) {
      console.error(`[${timestamp}] [${this.prefix}] ${message}`, logContext);
    } else {
      console.error(`[${timestamp}] [${this.prefix}] ${message}`);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    if (context) {
      console.warn(`[${timestamp}] [${this.prefix}] ${message}`, context);
    } else {
      console.warn(`[${timestamp}] [${this.prefix}] ${message}`);
    }
  }

  /**
   * Log debug message (only when DEBUG env is set)
   */
  debug(message: string, context?: Record<string, unknown>): void {
    if (process.env.DEBUG) {
      const timestamp = new Date().toISOString();
      if (context) {
        console.debug(`[${timestamp}] [${this.prefix}] ${message}`, context);
      } else {
        console.debug(`[${timestamp}] [${this.prefix}] ${message}`);
      }
    }
  }
}

/**
 * Factory function to create a logger instance
 *
 * @param prefix - Module or class name to prefix log messages
 * @returns Logger instance
 *
 * @example
 * ```typescript
 * const logger = createLogger('GoogleNewsCollector');
 * logger.info('Fetching news for keyword', { keyword: '환율' });
 * ```
 */
export const createLogger = (prefix: string): ILogger => new ConsoleLogger(prefix);
