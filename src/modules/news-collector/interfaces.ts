/**
 * News Collector Interfaces
 *
 * Defines contracts for news collection, content extraction, and filtering.
 * Implement these interfaces to add new news sources (Naver, Yahoo, etc.).
 *
 * @module news-collector/interfaces
 */

import { CollectionResult, NewsItem } from './types.js';

/**
 * News Metadata Collector Interface
 *
 * Collects news metadata (title, summary, URL, etc.) from a source.
 * Does NOT extract full article content - that's handled by IContentExtractor.
 *
 * @example
 * ```typescript
 * class NaverNewsCollector implements INewsMetadataCollector {
 *   async collectMetadata(startTime, endTime) {
 *     // Fetch from Naver News API
 *     return { success: true, newsItems: [...], ... };
 *   }
 * }
 * ```
 */
export interface INewsMetadataCollector {
  /**
   * Collect news metadata within a date range
   *
   * @param startTime - Start of date range (inclusive)
   * @param endTime - End of date range (inclusive)
   * @returns Collection result with metadata (no content field)
   */
  collectMetadata(startTime: Date, endTime: Date): Promise<CollectionResult>;
}

/**
 * Content Extractor Interface
 *
 * Extracts full article content from news URLs.
 * Handles dynamic content loading and various site layouts.
 *
 * @example
 * ```typescript
 * class PlaywrightExtractor implements IContentExtractor {
 *   async extractContent(newsItem) {
 *     // Navigate to URL and extract content
 *     return { ...newsItem, content: extractedText };
 *   }
 * }
 * ```
 */
export interface IContentExtractor {
  /**
   * Extract content from a single news item
   *
   * @param newsItem - News item with URL
   * @returns News item with content field populated
   */
  extractContent(newsItem: NewsItem): Promise<NewsItem>;

  /**
   * Extract content from multiple news items
   *
   * @param newsItems - Array of news items
   * @param options - Optional extraction options
   * @returns Array of news items with content (may filter out failures)
   */
  extractMultiple(newsItems: NewsItem[], options?: ExtractorOptions): Promise<NewsItem[]>;
}

/**
 * Options for content extraction
 */
export interface ExtractorOptions {
  /** Enable parallel extraction (default: false for rate limiting) */
  parallel?: boolean;

  /** Maximum concurrent extractions when parallel is true */
  maxConcurrent?: number;
}

/**
 * News Filter Interface
 *
 * Filters news items based on various criteria (AI analysis, rules, etc.).
 *
 * @example
 * ```typescript
 * class GeminiTitleFilter implements INewsFilter {
 *   async filter(newsItems) {
 *     // Use Gemini to filter by relevance
 *     return filteredItems;
 *   }
 * }
 * ```
 */
export interface INewsFilter {
  /**
   * Filter news items
   *
   * @param newsItems - Array of news items to filter
   * @returns Filtered array of news items
   */
  filter(newsItems: NewsItem[]): Promise<NewsItem[]>;
}

/**
 * News Collector Configuration
 */
export interface NewsCollectorConfig {
  /** News source identifier (e.g., 'GOOGLE_NEWS', 'NAVER_NEWS') */
  source: string;

  /** Default category for collected news */
  category?: string;

  /** Delay between HTTP requests (ms) for rate limiting */
  requestDelayMs: number;

  /** Timeout for network requests (ms) */
  timeoutMs: number;
}

/**
 * Combined News Service Interface
 *
 * High-level interface for complete news collection pipeline.
 */
export interface INewsService {
  /**
   * Collect and process news
   *
   * @param startTime - Start of date range
   * @param endTime - End of date range
   * @returns Fully processed collection result
   */
  collectNews(startTime: Date, endTime: Date): Promise<CollectionResult>;

  /**
   * Filter news by title (first pass)
   */
  filterNewsByTitle(newsItems: NewsItem[]): Promise<NewsItem[]>;

  /**
   * Filter news by content (second pass, after extraction)
   */
  filterNewsByContent(newsItems: NewsItem[]): Promise<NewsItem[]>;
}
