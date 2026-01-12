/**
 * PromptBuilder Example
 *
 * This file demonstrates how to use the PromptBuilder class.
 * Run with: npx tsx src/modules/script-generator/__test__/prompt-example.ts
 */

import { PromptBuilder } from '../prompt-builder.js';
import { NewsItem } from '@/modules/news-collector/types.js';

// Create sample news items
const sampleNews: NewsItem[] = [
  {
    title: '삼성전자 주가 -5% 급락',
    summary: '미중 무역 갈등 심화로 반도체 업종 전반 하락세',
    url: 'https://example.com/news/1',
    publishedAt: new Date('2026-01-12T09:00:00Z'),
    source: '경제신문',
    category: '증시',
    content: '삼성전자가 전일 대비 5% 하락하며 6만원대를 기록했다. 미중 무역 갈등이 심화되면서 반도체 업종 전반이 영향을 받았다.',
  },
  {
    title: '금리 인상 0.5%p 단행',
    summary: '한국은행, 인플레이션 대응 위해 기준금리 인상 결정',
    url: 'https://example.com/news/2',
    publishedAt: new Date('2026-01-12T10:00:00Z'),
    source: '금융일보',
    category: '금융',
    content: '한국은행이 기준금리를 0.5%p 인상하며 주택담보대출 이자 부담이 증가할 전망이다.',
  },
  {
    title: '비트코인 4만 달러 돌파',
    summary: '기관 투자자 매수세 몰리며 가상화폐 시장 급등',
    url: 'https://example.com/news/3',
    publishedAt: new Date('2026-01-12T11:00:00Z'),
    source: '디지털경제',
    category: '가상화폐',
    content: '비트코인이 4만 달러를 돌파하며 연초 대비 30% 상승했다.',
  },
];

// Example 1: Default (URGENT) template
console.log('='.repeat(80));
console.log('Example 1: URGENT Template (Default)');
console.log('='.repeat(80));

const builder1 = new PromptBuilder();
const prompt1 = builder1.buildScriptPrompt(sampleNews);

console.log(`Template: ${builder1.getTemplateName()}`);
console.log(`Prompt length: ${prompt1.length} characters`);
console.log('\nPrompt Preview (first 500 chars):');
console.log(prompt1.substring(0, 500) + '...\n');

// Example 2: INFORMATIVE template
console.log('='.repeat(80));
console.log('Example 2: INFORMATIVE Template');
console.log('='.repeat(80));

process.env.SCRIPT_TONE = 'INFORMATIVE';
const builder2 = new PromptBuilder();
const prompt2 = builder2.buildScriptPrompt(sampleNews);

console.log(`Template: ${builder2.getTemplateName()}`);
console.log(`Prompt length: ${prompt2.length} characters`);
console.log('\nPrompt Preview (first 500 chars):');
console.log(prompt2.substring(0, 500) + '...\n');

// Example 3: CONVERSATIONAL template
console.log('='.repeat(80));
console.log('Example 3: CONVERSATIONAL Template');
console.log('='.repeat(80));

process.env.SCRIPT_TONE = 'CONVERSATIONAL';
const builder3 = new PromptBuilder();
const prompt3 = builder3.buildScriptPrompt(sampleNews);

console.log(`Template: ${builder3.getTemplateName()}`);
console.log(`Prompt length: ${prompt3.length} characters`);
console.log('\nPrompt Preview (first 500 chars):');
console.log(prompt3.substring(0, 500) + '...\n');

// Example 4: Check news context injection
console.log('='.repeat(80));
console.log('Example 4: News Context Injection Verification');
console.log('='.repeat(80));

console.log('Checking if all news titles are in the prompt:');
sampleNews.forEach((news, index) => {
  const found = prompt1.includes(news.title);
  console.log(`  [${index + 1}] "${news.title}" - ${found ? '✓ Found' : '✗ Not found'}`);
});

console.log('\nChecking 4-stage structure in prompt:');
const stages = ['Hook', '문제', '영향', '결론'];
stages.forEach((stage) => {
  const found = prompt1.includes(stage);
  console.log(`  "${stage}" - ${found ? '✓ Found' : '✗ Not found'}`);
});

console.log('\n✓ All examples executed successfully!');
