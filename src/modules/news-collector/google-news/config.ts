/**
 * Google News Collector Configuration
 *
 * Configurable options for the Google News collector.
 *
 * @module news-collector/google-news/config
 */

import { NewsCollectorConfig } from '../interfaces.js';
import { TIMEOUTS } from '@/config/constants/timeouts.js';

/**
 * Default configuration for Google News collector
 */
export const DEFAULT_GOOGLE_NEWS_CONFIG: NewsCollectorConfig = {
  source: 'GOOGLE_NEWS',
  category: '경제',
  requestDelayMs: TIMEOUTS.REQUEST_DELAY,
  timeoutMs: TIMEOUTS.RSS_PARSE,
};

/**
 * Options for customizing Google News collection
 */
export interface GoogleNewsCollectorOptions {
  /** News category (default: '경제') */
  category?: string;

  /** Language code (default: 'ko') */
  language?: string;

  /** Country code (default: 'KR') */
  country?: string;

  /** Custom keywords to search (overrides default keywords) */
  keywords?: string[];
}

/**
 * Default values for Google News search parameters
 */
export const GOOGLE_NEWS_DEFAULTS = {
  LANGUAGE: 'ko',
  COUNTRY: 'KR',
  CEID: 'KR:ko',
  BASE_URL: 'https://news.google.com/rss/search',
} as const;
