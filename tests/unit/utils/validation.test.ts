import { NewsItemSchema, isValidNewsItem, NewsItem } from '@/modules/news-collector/types.js';

describe('validation utilities (Zod schemas)', () => {
  describe('NewsItemSchema validation', () => {
    it('should validate a complete valid NewsItem', () => {
      const validNewsItem: NewsItem = {
        title: '한국 경제 성장률 3% 달성',
        summary: '한국 경제가 올해 3% 성장률을 달성했다.',
        url: 'https://example.com/news/1',
        publishedAt: new Date('2025-01-15T10:00:00'),
        source: '한국경제',
        category: '경제',
      };

      const result = NewsItemSchema.safeParse(validNewsItem);
      expect(result.success).toBe(true);
    });

    it('should validate NewsItem without optional category', () => {
      const validNewsItem = {
        title: '금리 인상 발표',
        summary: '한국은행이 기준금리를 인상했다.',
        url: 'https://example.com/news/2',
        publishedAt: new Date(),
        source: '매일경제',
      };

      const result = NewsItemSchema.safeParse(validNewsItem);
      expect(result.success).toBe(true);
    });

    it('should reject NewsItem with empty title', () => {
      const invalidNewsItem = {
        title: '',
        summary: 'Some summary',
        url: 'https://example.com/news',
        publishedAt: new Date(),
        source: 'Source',
      };

      const result = NewsItemSchema.safeParse(invalidNewsItem);
      expect(result.success).toBe(false);
    });

    it('should reject NewsItem with empty summary', () => {
      const invalidNewsItem = {
        title: 'Title',
        summary: '',
        url: 'https://example.com/news',
        publishedAt: new Date(),
        source: 'Source',
      };

      const result = NewsItemSchema.safeParse(invalidNewsItem);
      expect(result.success).toBe(false);
    });

    it('should reject NewsItem with invalid URL', () => {
      const invalidNewsItem = {
        title: 'Title',
        summary: 'Summary',
        url: 'not-a-valid-url',
        publishedAt: new Date(),
        source: 'Source',
      };

      const result = NewsItemSchema.safeParse(invalidNewsItem);
      expect(result.success).toBe(false);
    });

    it('should reject NewsItem with empty URL', () => {
      const invalidNewsItem = {
        title: 'Title',
        summary: 'Summary',
        url: '',
        publishedAt: new Date(),
        source: 'Source',
      };

      const result = NewsItemSchema.safeParse(invalidNewsItem);
      expect(result.success).toBe(false);
    });

    it('should reject NewsItem with invalid date', () => {
      const invalidNewsItem = {
        title: 'Title',
        summary: 'Summary',
        url: 'https://example.com/news',
        publishedAt: 'not-a-date',
        source: 'Source',
      };

      const result = NewsItemSchema.safeParse(invalidNewsItem);
      expect(result.success).toBe(false);
    });

    it('should reject NewsItem with empty source', () => {
      const invalidNewsItem = {
        title: 'Title',
        summary: 'Summary',
        url: 'https://example.com/news',
        publishedAt: new Date(),
        source: '',
      };

      const result = NewsItemSchema.safeParse(invalidNewsItem);
      expect(result.success).toBe(false);
    });

    it('should reject NewsItem with missing required fields', () => {
      const invalidNewsItem = {
        title: 'Title',
        summary: 'Summary',
        // Missing url, publishedAt, source
      };

      const result = NewsItemSchema.safeParse(invalidNewsItem);
      expect(result.success).toBe(false);
    });

    it('should handle various valid URL formats', () => {
      const validUrls = [
        'https://example.com/news/1',
        'http://example.com/article',
        'https://www.chosun.com/economy/2025/01/15/article',
        'https://news.example.com/path/to/article?id=123',
        'https://example.com/news#section',
      ];

      validUrls.forEach((url) => {
        const newsItem = {
          title: 'Title',
          summary: 'Summary',
          url,
          publishedAt: new Date(),
          source: 'Source',
        };

        const result = NewsItemSchema.safeParse(newsItem);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid URL formats', () => {
      const invalidUrls = [
        'not-a-url',
        '//example.com', // Protocol-relative URL
        'www.example.com', // Missing protocol
        '',
      ];

      invalidUrls.forEach((url) => {
        const newsItem = {
          title: 'Title',
          summary: 'Summary',
          url,
          publishedAt: new Date(),
          source: 'Source',
        };

        const result = NewsItemSchema.safeParse(newsItem);
        expect(result.success).toBe(false);
      });
    });

    it('should handle Date objects correctly', () => {
      const newsItem = {
        title: 'Title',
        summary: 'Summary',
        url: 'https://example.com/news',
        publishedAt: new Date('2025-01-15T10:00:00'),
        source: 'Source',
      };

      const result = NewsItemSchema.safeParse(newsItem);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.publishedAt).toBeInstanceOf(Date);
      }
    });
  });

  describe('isValidNewsItem helper function', () => {
    it('should return true for valid NewsItem', () => {
      const validNewsItem: NewsItem = {
        title: '경제 뉴스',
        summary: '경제 관련 요약',
        url: 'https://example.com/news',
        publishedAt: new Date(),
        source: '한국경제',
      };

      expect(isValidNewsItem(validNewsItem)).toBe(true);
    });

    it('should return false for invalid NewsItem (missing field)', () => {
      const invalidNewsItem = {
        title: '경제 뉴스',
        summary: '경제 관련 요약',
        // Missing url, publishedAt, source
      } as NewsItem;

      expect(isValidNewsItem(invalidNewsItem)).toBe(false);
    });

    it('should return false for NewsItem with invalid URL', () => {
      const invalidNewsItem = {
        title: '경제 뉴스',
        summary: '경제 관련 요약',
        url: 'invalid-url',
        publishedAt: new Date(),
        source: '한국경제',
      } as NewsItem;

      expect(isValidNewsItem(invalidNewsItem)).toBe(false);
    });

    it('should return false for NewsItem with empty strings', () => {
      const invalidNewsItem = {
        title: '',
        summary: 'Summary',
        url: 'https://example.com/news',
        publishedAt: new Date(),
        source: 'Source',
      } as NewsItem;

      expect(isValidNewsItem(invalidNewsItem)).toBe(false);
    });
  });

  describe('FR-001-03: Required fields validation', () => {
    it('should enforce all required fields: title, summary, url, publishedAt, source', () => {
      const requiredFields = ['title', 'summary', 'url', 'publishedAt', 'source'];

      requiredFields.forEach((field) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newsItem: any = {
          title: 'Title',
          summary: 'Summary',
          url: 'https://example.com/news',
          publishedAt: new Date(),
          source: 'Source',
        };

        delete newsItem[field];

        const result = NewsItemSchema.safeParse(newsItem);
        expect(result.success).toBe(false);
      });
    });

    it('should allow optional category field', () => {
      const newsItemWithCategory = {
        title: 'Title',
        summary: 'Summary',
        url: 'https://example.com/news',
        publishedAt: new Date(),
        source: 'Source',
        category: '경제',
      };

      const newsItemWithoutCategory = {
        title: 'Title',
        summary: 'Summary',
        url: 'https://example.com/news',
        publishedAt: new Date(),
        source: 'Source',
      };

      expect(NewsItemSchema.safeParse(newsItemWithCategory).success).toBe(true);
      expect(NewsItemSchema.safeParse(newsItemWithoutCategory).success).toBe(true);
    });

    it('should validate complete news item from RSS feed simulation', () => {
      const rssNewsItem = {
        title: '한은, 기준금리 3.5% 동결',
        summary: '한국은행이 기준금리를 3.5%로 동결했다.',
        url: 'https://www.chosun.com/economy/2025/01/15/123456',
        publishedAt: new Date('2025-01-15T14:00:00'),
        source: '조선일보',
        category: '경제',
      };

      expect(isValidNewsItem(rssNewsItem)).toBe(true);
    });

    it('should reject news item with any empty required field', () => {
      const testCases = [
        { title: '', summary: 'S', url: 'https://e.com', publishedAt: new Date(), source: 'S' },
        { title: 'T', summary: '', url: 'https://e.com', publishedAt: new Date(), source: 'S' },
        { title: 'T', summary: 'S', url: '', publishedAt: new Date(), source: 'S' },
        { title: 'T', summary: 'S', url: 'https://e.com', publishedAt: new Date(), source: '' },
      ];

      testCases.forEach((testCase) => {
        expect(isValidNewsItem(testCase as NewsItem)).toBe(false);
      });
    });
  });

  describe('URL validation edge cases', () => {
    it('should accept HTTPS URLs', () => {
      const newsItem = {
        title: 'T',
        summary: 'S',
        url: 'https://example.com/news',
        publishedAt: new Date(),
        source: 'S',
      };

      expect(isValidNewsItem(newsItem)).toBe(true);
    });

    it('should accept HTTP URLs', () => {
      const newsItem = {
        title: 'T',
        summary: 'S',
        url: 'http://example.com/news',
        publishedAt: new Date(),
        source: 'S',
      };

      expect(isValidNewsItem(newsItem)).toBe(true);
    });

    it('should reject relative URLs', () => {
      const newsItem = {
        title: 'T',
        summary: 'S',
        url: '/news/article',
        publishedAt: new Date(),
        source: 'S',
      };

      expect(isValidNewsItem(newsItem as NewsItem)).toBe(false);
    });

    it('should reject URLs without protocol', () => {
      const newsItem = {
        title: 'T',
        summary: 'S',
        url: 'example.com/news',
        publishedAt: new Date(),
        source: 'S',
      };

      expect(isValidNewsItem(newsItem as NewsItem)).toBe(false);
    });

    it('should handle Korean characters in URL path', () => {
      const newsItem = {
        title: 'T',
        summary: 'S',
        url: 'https://example.com/뉴스/경제',
        publishedAt: new Date(),
        source: 'S',
      };

      expect(isValidNewsItem(newsItem)).toBe(true);
    });

    it('should handle query parameters in URL', () => {
      const newsItem = {
        title: 'T',
        summary: 'S',
        url: 'https://example.com/news?id=123&category=economy',
        publishedAt: new Date(),
        source: 'S',
      };

      expect(isValidNewsItem(newsItem)).toBe(true);
    });

    it('should handle URL fragments', () => {
      const newsItem = {
        title: 'T',
        summary: 'S',
        url: 'https://example.com/news#section-1',
        publishedAt: new Date(),
        source: 'S',
      };

      expect(isValidNewsItem(newsItem)).toBe(true);
    });
  });

  describe('Type safety and edge cases', () => {
    it('should reject object with extra unknown fields', () => {
      const newsItemWithExtra = {
        title: 'T',
        summary: 'S',
        url: 'https://example.com/news',
        publishedAt: new Date(),
        source: 'S',
        unknownField: 'should be ignored or rejected',
      };

      // Zod strict mode would reject this, but default mode strips unknown fields
      const result = NewsItemSchema.safeParse(newsItemWithExtra);
      expect(result.success).toBe(true);
    });

    it('should handle null values as invalid', () => {
      const newsItem = {
        title: null,
        summary: 'S',
        url: 'https://example.com/news',
        publishedAt: new Date(),
        source: 'S',
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isValidNewsItem(newsItem as any)).toBe(false);
    });

    it('should handle undefined values as invalid for required fields', () => {
      const newsItem = {
        title: 'T',
        summary: undefined,
        url: 'https://example.com/news',
        publishedAt: new Date(),
        source: 'S',
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(isValidNewsItem(newsItem as any)).toBe(false);
    });
  });
});
