/**
 * CSS Selectors for Content Extraction
 *
 * Centralized CSS selectors used for extracting article content
 * from various news websites.
 *
 * @module config/constants/selectors
 */

/**
 * Article content selectors in priority order
 *
 * The extractor tries each selector in order until content is found.
 * More specific selectors are listed first for better accuracy.
 */
export const ARTICLE_SELECTORS = [
  'article',
  '.article-content',
  '#article-content',
  '#articleContent',
  '.news-content',
  '.article-body',
  '#articleBody',
  '#article-body', // Fixed: was '#argicle-body' (typo)
  'main',
  '.post-content',
  '.entry-content',
  '[itemprop="articleBody"]',
] as const;

/**
 * Site-specific selectors for known news sources
 *
 * Can be used for optimized extraction from specific domains.
 * Falls back to ARTICLE_SELECTORS if site is not in this map.
 */
export const SITE_SPECIFIC_SELECTORS: Record<string, readonly string[]> = {
  // Example structure for future site-specific optimizations
  // 'naver.com': ['#articleBodyContents', '.article_body', 'article'],
  // 'chosun.com': ['.article-body', '.story-body'],
} as const;

/**
 * Elements to remove during HTML cleaning
 */
export const ELEMENTS_TO_REMOVE = [
  'script',
  'style',
  'iframe',
  'figure',
  '.ad',
  '.advertisement',
  '.head_view',
  'nav',
  'footer',
  'aside',
] as const;
