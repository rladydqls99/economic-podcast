import * as cheerio from 'cheerio';

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
