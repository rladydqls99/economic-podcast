/**
 * PromptBuilder Unit Tests
 *
 * Tests for the PromptBuilder class including:
 * - Prompt generation with different news item counts
 * - 4-stage structure verification
 * - News context injection
 * - Template switching
 * - Edge cases and error handling
 *
 * @module script-generator/__test__/prompt-builder.unit.test
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PromptBuilder } from '../prompt-builder.js';
import { NewsItem } from '@/modules/news-collector/types.js';

// =================================================================
// Mock Data
// =================================================================

const createMockNewsItem = (overrides?: Partial<NewsItem>): NewsItem => ({
  title: '삼성전자 주가 -5% 급락',
  summary: '미중 무역 갈등 심화로 반도체 업종 전반 하락세',
  url: 'https://example.com/news/1',
  publishedAt: new Date('2026-01-12T09:00:00Z'),
  source: '경제신문',
  category: '증시',
  content:
    '삼성전자가 전일 대비 5% 하락하며 6만원대를 기록했다. 미중 무역 갈등이 심화되면서 반도체 업종 전반이 영향을 받았다.',
  ...overrides,
});

const createThreeMockNews = (): NewsItem[] => [
  createMockNewsItem({
    title: '삼성전자 주가 -5% 급락',
    summary: '미중 무역 갈등 심화로 반도체 업종 전반 하락세',
    url: 'https://example.com/news/1',
  }),
  createMockNewsItem({
    title: '금리 인상 0.5%p 단행',
    summary: '한국은행, 인플레이션 대응 위해 기준금리 인상 결정',
    url: 'https://example.com/news/2',
    content: '한국은행이 기준금리를 0.5%p 인상하며 주택담보대출 이자 부담이 증가할 전망이다.',
  }),
  createMockNewsItem({
    title: '비트코인 4만 달러 돌파',
    summary: '기관 투자자 매수세 몰리며 가상화폐 시장 급등',
    url: 'https://example.com/news/3',
    content: '비트코인이 4만 달러를 돌파하며 연초 대비 30% 상승했다.',
  }),
];

const createFiveMockNews = (): NewsItem[] => [
  ...createThreeMockNews(),
  createMockNewsItem({
    title: '테슬라 실적 어닝 서프라이즈',
    summary: '전기차 판매량 시장 예상치 20% 상회',
    url: 'https://example.com/news/4',
    content: '테슬라의 분기 실적이 시장 예상을 크게 뛰어넘으며 주가가 급등했다.',
  }),
  createMockNewsItem({
    title: '원달러 환율 1,350원 돌파',
    summary: '달러 강세 지속, 수입 물가 상승 우려',
    url: 'https://example.com/news/5',
    content: '원달러 환율이 1,350원을 돌파하며 수입 물가 상승 압력이 커지고 있다.',
  }),
];

// =================================================================
// Test Suite
// =================================================================

describe('PromptBuilder', () => {
  let builder: PromptBuilder;
  let originalEnv: string | undefined;

  beforeEach(() => {
    // Save original environment variable
    originalEnv = process.env.SCRIPT_TONE;
    // Reset to default for each test
    delete process.env.SCRIPT_TONE;
    builder = new PromptBuilder();
  });

  afterEach(() => {
    // Restore original environment variable
    if (originalEnv !== undefined) {
      process.env.SCRIPT_TONE = originalEnv;
    } else {
      delete process.env.SCRIPT_TONE;
    }
  });

  // =================================================================
  // Constructor Tests
  // =================================================================

  describe('Constructor', () => {
    it('should create PromptBuilder with default config', () => {
      const builder = new PromptBuilder();
      expect(builder).toBeInstanceOf(PromptBuilder);
      expect(builder.getTemplateName()).toBe('URGENT');
    });

    it('should create PromptBuilder with custom config', () => {
      const builder = new PromptBuilder({
        temperature: 0.9,
        maxTokens: 1000,
        timeout: 10000,
      });
      expect(builder).toBeInstanceOf(PromptBuilder);
    });

    it('should select URGENT template by default', () => {
      const builder = new PromptBuilder();
      expect(builder.getTemplateName()).toBe('URGENT');
    });

    it('should select template based on SCRIPT_TONE environment variable', () => {
      const builder = new PromptBuilder({}, 'INFORMATIVE');
      expect(builder.getTemplateName()).toBe('INFORMATIVE');
    });
  });

  // =================================================================
  // buildScriptPrompt Tests
  // =================================================================

  describe('buildScriptPrompt', () => {
    describe('Basic Functionality', () => {
      it('should generate prompt with 3 news items', () => {
        const newsItems = createThreeMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        expect(prompt).toBeTruthy();
        expect(typeof prompt).toBe('string');
        expect(prompt.length).toBeGreaterThan(0);
      });

      it('should generate prompt with 5 news items', () => {
        const newsItems = createFiveMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        expect(prompt).toBeTruthy();
        expect(typeof prompt).toBe('string');
        expect(prompt.length).toBeGreaterThan(0);
      });

      it('should generate different prompts for different news items', () => {
        const news1 = createThreeMockNews();
        const news2 = createFiveMockNews();

        const prompt1 = builder.buildScriptPrompt(news1);
        const prompt2 = builder.buildScriptPrompt(news2);

        expect(prompt1).not.toBe(prompt2);
      });
    });

    describe('4-Stage Structure Verification', () => {
      it('should include Hook stage instruction', () => {
        const newsItems = createThreeMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        expect(prompt).toContain('Hook');
        expect(prompt).toContain('0-3초');
        expect(prompt).toContain('충격적인 사실');
      });

      it('should include Problem stage instruction', () => {
        const newsItems = createThreeMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        expect(prompt).toContain('문제');
        expect(prompt).toContain('3-15초');
        expect(prompt).toContain('배경 설명');
      });

      it('should include Impact stage instruction', () => {
        const newsItems = createThreeMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        expect(prompt).toContain('영향');
        expect(prompt).toContain('15-40초');
        expect(prompt).toContain('개인');
      });

      it('should include Conclusion stage instruction', () => {
        const newsItems = createThreeMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        expect(prompt).toContain('결론');
        expect(prompt).toContain('40-45초');
        expect(prompt).toContain('행동 유도');
      });

      it('should include all 4 stages in order', () => {
        const newsItems = createThreeMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        // Use more specific search patterns to avoid false matches
        const hookIndex = prompt.indexOf('**Hook');
        const problemIndex = prompt.indexOf('**문제');
        const impactIndex = prompt.indexOf('**영향');
        const conclusionIndex = prompt.indexOf('**결론');

        expect(hookIndex).toBeGreaterThan(-1);
        expect(problemIndex).toBeGreaterThan(-1);
        expect(impactIndex).toBeGreaterThan(-1);
        expect(conclusionIndex).toBeGreaterThan(-1);

        expect(hookIndex).toBeLessThan(problemIndex);
        expect(problemIndex).toBeLessThan(impactIndex);
        expect(impactIndex).toBeLessThan(conclusionIndex);
      });
    });

    describe('News Context Injection', () => {
      it('should inject news titles', () => {
        const newsItems = createThreeMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        newsItems.forEach((item) => {
          expect(prompt).toContain(item.title);
        });
      });

      it('should inject news summaries', () => {
        const newsItems = createThreeMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        newsItems.forEach((item) => {
          expect(prompt).toContain(item.summary);
        });
      });

      it('should inject news sources', () => {
        const newsItems = createThreeMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        newsItems.forEach((item) => {
          expect(prompt).toContain(item.source);
        });
      });

      it('should inject news content when available', () => {
        const newsItems = createThreeMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        newsItems
          .filter((item) => item.content)
          .forEach((item) => {
            // Check for partial match since content is included as-is
            const contentPreview = item.content!.substring(0, 50);
            expect(prompt).toContain(contentPreview);
          });
      });

      it('should number news items correctly', () => {
        const newsItems = createFiveMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        expect(prompt).toContain('[뉴스 1]');
        expect(prompt).toContain('[뉴스 2]');
        expect(prompt).toContain('[뉴스 3]');
        expect(prompt).toContain('[뉴스 4]');
        expect(prompt).toContain('[뉴스 5]');
      });
    });

    describe('Viral Principles', () => {
      it('should include viral DNA principles', () => {
        const newsItems = createThreeMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        expect(prompt).toContain('바이럴 DNA 원칙');
      });

      it('should include specific viral elements', () => {
        const newsItems = createThreeMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        expect(prompt).toContain('숫자');
        expect(prompt).toContain('개인 관련성');
        expect(prompt).toContain('감정 트리거');
        expect(prompt).toContain('행동 유도');
      });

      it('should mention Korean culture context', () => {
        const newsItems = createThreeMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        expect(prompt).toContain('한국');
      });
    });

    describe('Output Format', () => {
      it('should specify JSON output format', () => {
        const newsItems = createThreeMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        expect(prompt).toContain('JSON');
        expect(prompt).toContain('hook');
        expect(prompt).toContain('problem');
        expect(prompt).toContain('impact');
        expect(prompt).toContain('conclusion');
      });

      it('should include character constraints', () => {
        const newsItems = createThreeMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        expect(prompt).toContain('180-270자');
        expect(prompt).toContain('10-30자');
        expect(prompt).toContain('50-100자');
        expect(prompt).toContain('100-150자');
        expect(prompt).toContain('20-50자');
      });

      it('should mention 4-5 chars/second speaking rate', () => {
        const newsItems = createThreeMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        expect(prompt).toContain('4-5자/초');
      });
    });

    describe('Korean Language Support', () => {
      it('should handle Korean characters correctly', () => {
        const newsItems = [
          createMockNewsItem({
            title: '한글 테스트: 경제 뉴스',
            summary: '가나다라마바사아자차카타파하',
            content: '이것은 한글 인코딩 테스트입니다. 특수문자: !@#$%^&*()',
          }),
          ...createThreeMockNews().slice(1),
        ];

        const prompt = builder.buildScriptPrompt(newsItems);

        expect(prompt).toContain('한글 테스트: 경제 뉴스');
        expect(prompt).toContain('가나다라마바사아자차카타파하');
        expect(prompt).toContain('이것은 한글 인코딩 테스트입니다');
      });

      it('should handle special characters in news content', () => {
        const newsItems = [
          createMockNewsItem({
            title: '특수문자 테스트 @#$%',
            summary: '따옴표 "테스트" 및 \' 작은따옴표',
            content: '백틱 `테스트` 및 역슬래시 \\ 처리',
          }),
          ...createThreeMockNews().slice(1),
        ];

        const prompt = builder.buildScriptPrompt(newsItems);

        expect(prompt).toContain('특수문자 테스트');
        expect(prompt).toContain('따옴표');
      });

      it('should handle empty content gracefully', () => {
        const newsItems = [
          createMockNewsItem({
            content: undefined,
          }),
          createMockNewsItem({
            content: '',
          }),
          createMockNewsItem({
            content: '   ',
          }),
        ];

        const prompt = builder.buildScriptPrompt(newsItems);

        expect(prompt).toBeTruthy();
        expect(prompt.length).toBeGreaterThan(0);
      });
    });

    describe('Error Handling', () => {
      it('should throw error for empty news items array', () => {
        expect(() => {
          builder.buildScriptPrompt([]);
        }).toThrow('News items cannot be empty');
      });

      it('should throw error for null news items', () => {
        expect(() => {
          builder.buildScriptPrompt(null as unknown as NewsItem[]);
        }).toThrow('News items cannot be empty');
      });

      it('should throw error for undefined news items', () => {
        expect(() => {
          builder.buildScriptPrompt(undefined as unknown as NewsItem[]);
        }).toThrow('News items cannot be empty');
      });

      it('should throw error for less than 3 news items', () => {
        const newsItems = createThreeMockNews().slice(0, 2);

        expect(() => {
          builder.buildScriptPrompt(newsItems);
        }).toThrow('At least 3 news items are required');
      });

      it('should throw error for more than 5 news items', () => {
        const newsItems = [...createFiveMockNews(), createMockNewsItem({ url: 'https://example.com/news/6' })];

        expect(() => {
          builder.buildScriptPrompt(newsItems);
        }).toThrow('Maximum 5 news items allowed');
      });
    });
  });

  // =================================================================
  // Template Selection Tests
  // =================================================================

  describe('Template Selection', () => {
    describe('URGENT Template', () => {
      beforeEach(() => {
        builder = new PromptBuilder({}, 'URGENT');
      });

      it('should select URGENT template', () => {
        expect(builder.getTemplateName()).toBe('URGENT');
      });

      it('should include urgency-related keywords', () => {
        const newsItems = createThreeMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        expect(prompt).toContain('긴급');
      });

      it('should emphasize immediate impact', () => {
        const newsItems = createThreeMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        expect(prompt).toContain('즉각');
      });
    });

    describe('INFORMATIVE Template', () => {
      beforeEach(() => {
        builder = new PromptBuilder({}, 'INFORMATIVE');
      });

      it('should select INFORMATIVE template', () => {
        expect(builder.getTemplateName()).toBe('INFORMATIVE');
      });

      it('should include educational keywords', () => {
        const newsItems = createThreeMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        expect(prompt).toContain('교육');
      });

      it('should focus on clear explanation', () => {
        const newsItems = createThreeMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        expect(prompt).toContain('명확');
        expect(prompt).toContain('쉽');
      });

      it('should encourage question-based hooks', () => {
        const newsItems = createThreeMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        expect(prompt).toContain('질문');
      });
    });

    describe('CONVERSATIONAL Template', () => {
      beforeEach(() => {
        builder = new PromptBuilder({}, 'CONVERSATIONAL');
      });

      it('should select CONVERSATIONAL template', () => {
        expect(builder.getTemplateName()).toBe('CONVERSATIONAL');
      });

      it('should include conversational keywords', () => {
        const newsItems = createThreeMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        expect(prompt).toContain('친구');
        expect(prompt).toContain('대화');
      });

      it('should encourage storytelling', () => {
        const newsItems = createThreeMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        expect(prompt).toContain('스토리');
      });

      it('should use friendly language', () => {
        const newsItems = createThreeMockNews();
        const prompt = builder.buildScriptPrompt(newsItems);

        expect(prompt).toContain('여러분');
      });
    });

    describe('Template Switching', () => {
      it('should handle case-insensitive template names', () => {
        const builder = new PromptBuilder({}, 'informative');
        expect(builder.getTemplateName()).toBe('INFORMATIVE');

        const builder2 = new PromptBuilder({}, 'Conversational');
        expect(builder2.getTemplateName()).toBe('CONVERSATIONAL');
      });

      it('should trim whitespace from template names', () => {
        const builder = new PromptBuilder({}, '  INFORMATIVE  ');
        expect(builder.getTemplateName()).toBe('INFORMATIVE');
      });

      it('should default to URGENT for unknown template names', () => {
        const builder = new PromptBuilder({}, 'UNKNOWN_TEMPLATE');
        expect(builder.getTemplateName()).toBe('URGENT');
      });

      it('should default to URGENT when SCRIPT_TONE is not set', () => {
        const builder = new PromptBuilder();
        expect(builder.getTemplateName()).toBe('URGENT');
      });
    });

    describe('Template Consistency', () => {
      it('should maintain consistent structure across templates', () => {
        const newsItems = createThreeMockNews();

        const templates = ['URGENT', 'INFORMATIVE', 'CONVERSATIONAL'];
        const prompts = templates.map((template) => {
          const builder = new PromptBuilder({}, template);
          return builder.buildScriptPrompt(newsItems);
        });

        // All templates should include these core elements
        prompts.forEach((prompt) => {
          expect(prompt).toContain('Hook');
          expect(prompt).toContain('문제');
          expect(prompt).toContain('영향');
          expect(prompt).toContain('결론');
          expect(prompt).toContain('JSON');
          expect(prompt).toContain('바이럴 DNA 원칙');
        });
      });

      it('should inject same news context across templates', () => {
        const newsItems = createThreeMockNews();

        const templates = ['URGENT', 'INFORMATIVE', 'CONVERSATIONAL'];
        const prompts = templates.map((template) => {
          const builder = new PromptBuilder({}, template);
          return builder.buildScriptPrompt(newsItems);
        });

        // All templates should contain the same news titles
        prompts.forEach((prompt) => {
          newsItems.forEach((item) => {
            expect(prompt).toContain(item.title);
          });
        });
      });
    });
  });

  // =================================================================
  // getTemplateName Tests
  // =================================================================

  describe('getTemplateName', () => {
    it('should return current template name', () => {
      const builder = new PromptBuilder();
      expect(builder.getTemplateName()).toBe('URGENT');
    });

    it('should return correct name after template selection', () => {
      const builder = new PromptBuilder({}, 'INFORMATIVE');
      expect(builder.getTemplateName()).toBe('INFORMATIVE');
    });
  });
});
