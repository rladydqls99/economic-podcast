import * as cheerio from 'cheerio';
import { NOISE_PATTERNS } from '@/config/noise_patterns.js';

/**
 * HTML에서 본문 텍스트 추출 (공통 패턴)
 * - 여러 셀렉터를 순회하며 유효한 콘텐츠 찾기
 * - 최소 길이 검증 (100자 이상)
 *
 * @param html - 파싱할 HTML 문자열
 * @param selectors - 시도할 CSS 셀렉터 배열 (우선순위 순)
 * @returns 추출된 본문 텍스트 또는 null
 */
export function extractArticleContent(html: string, selectors: string[]): string | null {
  const $ = cheerio.load(html);

  for (const selector of selectors) {
    const content = $(selector).text().trim();
    if (content && content.length > 100) {
      return content;
    }
  }

  return null;
}

/**
 * 불필요한 요소 제거 (광고, 스크립트 등)
 * - 스크립트, 스타일, iframe 제거
 * - 광고 관련 클래스 제거
 *
 * @param html - 정리할 HTML 문자열
 * @returns 정리된 HTML 문자열
 */
export function cleanHtml(html: string): string {
  const $ = cheerio.load(html);

  // 광고, 스크립트, 스타일, 이미지 관련 요소 제거
  $('script, style, iframe, figure, .ad, .advertisement').remove();
  // 구글 뉴스 불필요한 요소
  $('.head_view').remove();

  return $.html() || '';
}

/**
 * 메타 태그에서 정보 추출
 * - Open Graph, Twitter Card 등의 메타 정보 추출
 *
 * @param html - 파싱할 HTML 문자열
 * @param property - 메타 태그의 property 속성 값
 * @returns 메타 태그의 content 값 또는 null
 *
 * @example
 * extractMetaContent(html, 'og:title')
 * extractMetaContent(html, 'og:description')
 */
export function extractMetaContent(html: string, property: string): string | null {
  const $ = cheerio.load(html);
  return $(`meta[property="${property}"]`).attr('content') || null;
}

/**
 * 뉴스 본문에서 의미있는 내용만 추출 (노이즈 제거)
 *
 * @param content - 원본 본문 텍스트
 * @param options - 추출 옵션
 * @param options.maxLength - 최대 길이 (기본값: 800자)
 * @param options.minLineLength - 의미있는 줄로 판단할 최소 길이 (기본값: 10자)
 * @param options.startDetectionLength - 본문 시작으로 판단할 줄 길이 (기본값: 30자)
 * @param options.preserveSentence - 문장 중간 자르기 방지 여부 (기본값: true)
 * @returns 정제된 본문 텍스트
 *
 * @description
 * 1. 광고성 문구, 구독 유도, 저작권 안내 등 노이즈 패턴 제거
 * 2. 짧은 문장 건너뛰고 본문 시작 지점 탐지
 * 3. 실제 뉴스 내용 위주로 추출
 * 4. 지정된 길이로 자르되, 문장 중간에서 자르지 않음
 *
 * @example
 * const raw = "광고\n\n오늘 삼성전자가 신제품을 발표했다...\n\n©저작권";
 * const clean = extractMeaningfulContent(raw);
 * // "오늘 삼성전자가 신제품을 발표했다..."
 *
 * @example
 * // 옵션 사용
 * const clean = extractMeaningfulContent(raw, {
 *   maxLength: 500,
 *   minLineLength: 20,
 *   preserveSentence: false
 * });
 */
export function extractMeaningfulContent(
  content: string,
  options: {
    maxLength?: number;
    minLineLength?: number;
    startDetectionLength?: number;
    preserveSentence?: boolean;
  } = {}
): string {
  if (!content) return '';

  const {
    maxLength = 800,
    minLineLength = 10,
    startDetectionLength = 30,
    preserveSentence = true,
  } = options;

  // 1. 문장 단위로 분리 (개행 기준)
  const lines = content.split('\n').map((line) => line.trim());

  // 2. 의미있는 문장만 필터링
  const meaningfulLines: string[] = [];
  let foundStart = false;

  for (const line of lines) {
    // 빈 줄 또는 너무 짧은 줄 스킵
    if (!line || line.length < minLineLength) continue;

    // 노이즈 패턴 매칭 시 스킵
    if (NOISE_PATTERNS.some((pattern) => pattern.pattern.test(line))) continue;

    // 첫 의미있는 문장 발견 (본문 시작 감지)
    if (!foundStart && line.length >= startDetectionLength) {
      foundStart = true;
    }

    if (foundStart) {
      meaningfulLines.push(line);
    }
  }

  // 3. 합치기
  const cleaned = meaningfulLines.join(' ');

  // 4. 최대 길이로 자르기
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  const truncated = cleaned.slice(0, maxLength);

  // 5. 문장 중간 자르기 방지 (옵션)
  if (!preserveSentence) {
    return truncated;
  }

  // 마지막 마침표 찾기 (한글 종결어미 포함: 다, 요, .)
  const lastPeriod = Math.max(truncated.lastIndexOf('.'), truncated.lastIndexOf('다'), truncated.lastIndexOf('요'));

  // 절반 이상 지점에서 마침표 발견 시 그곳까지만 반환 (너무 짧게 잘리는 것 방지)
  return lastPeriod > maxLength / 2 ? truncated.slice(0, lastPeriod + 1) : truncated;
}

/**
 * 여러 메타 태그에서 정보 추출 (우선순위 순)
 * - 첫 번째로 발견된 값 반환
 *
 * @param html - 파싱할 HTML 문자열
 * @param properties - 시도할 property 배열 (우선순위 순)
 * @returns 첫 번째로 발견된 content 값 또는 null
 */
export function extractMetaContentMultiple(html: string, properties: string[]): string | null {
  for (const property of properties) {
    const content = extractMetaContent(html, property);
    if (content) {
      return content;
    }
  }
  return null;
}

/**
 * HTML에서 제목 추출
 * - 메타 태그 우선, 없으면 title 태그 사용
 *
 * @param html - 파싱할 HTML 문자열
 * @returns 추출된 제목 또는 null
 */
export function extractTitle(html: string): string | null {
  // 1. Open Graph 제목 시도
  const ogTitle = extractMetaContent(html, 'og:title');
  if (ogTitle) return ogTitle;

  // 2. Twitter 제목 시도
  const twitterTitle = extractMetaContent(html, 'twitter:title');
  if (twitterTitle) return twitterTitle;

  // 3. title 태그 시도
  const $ = cheerio.load(html);
  const titleText = $('title').text().trim();
  if (titleText) return titleText;

  return null;
}

/**
 * HTML에서 설명 추출
 * - 메타 태그 우선, 없으면 description 메타 태그 사용
 *
 * @param html - 파싱할 HTML 문자열
 * @returns 추출된 설명 또는 null
 */
export function extractDescription(html: string): string | null {
  // 1. Open Graph 설명 시도
  const ogDescription = extractMetaContent(html, 'og:description');
  if (ogDescription) return ogDescription;

  // 2. Twitter 설명 시도
  const twitterDescription = extractMetaContent(html, 'twitter:description');
  if (twitterDescription) return twitterDescription;

  // 3. description 메타 태그 시도
  const $ = cheerio.load(html);
  const description = $('meta[name="description"]').attr('content');
  if (description) return description;

  return null;
}
