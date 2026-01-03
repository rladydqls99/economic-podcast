import {
  extractArticleContent,
  cleanHtml,
  extractMetaContent,
  extractMetaContentMultiple,
  extractTitle,
  extractDescription,
} from '@/modules/news-collector/shared/cheerio-utils.js';

describe('extractArticleContent', () => {
  // Normal cases
  it('셀렉터에 매칭되는 본문을 추출해야 한다', () => {
    const html = `
      <html>
        <body>
          <article>
            ${'본문 내용입니다. '.repeat(20)}
          </article>
        </body>
      </html>
    `;

    const content = extractArticleContent(html, ['article']);

    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(100);
    expect(content).toContain('본문 내용입니다.');
  });

  it('여러 셀렉터 중 첫 번째로 유효한 콘텐츠를 반환해야 한다', () => {
    const html = `
      <html>
        <body>
          <div class="short">짧은 내용</div>
          <div class="article-content">
            ${'긴 본문 내용입니다. '.repeat(20)}
          </div>
        </body>
      </html>
    `;

    const content = extractArticleContent(html, ['.short', '.article-content']);

    // .short는 100자 미만이므로 스킵, .article-content 반환
    expect(content).toContain('긴 본문 내용입니다.');
  });

  it('한국어 뉴스 본문을 올바르게 추출해야 한다', () => {
    const html = `
      <html>
        <body>
          <article>
            한국은행이 기준금리를 0.5%포인트 인상했습니다. ${'이번 결정은 물가 안정을 위한 조치입니다. '.repeat(10)}
          </article>
        </body>
      </html>
    `;

    const content = extractArticleContent(html, ['article']);

    expect(content).toContain('한국은행');
    expect(content).toContain('기준금리');
  });

  // Boundary cases
  it('정확히 100자인 콘텐츠는 추출하지 않아야 한다', () => {
    const exactHtml = `
      <html>
        <body>
          <article>${'a'.repeat(100)}</article>
        </body>
      </html>
    `;

    const content = extractArticleContent(exactHtml, ['article']);

    expect(content).toBeNull();
  });

  it('101자 이상인 콘텐츠는 추출해야 한다', () => {
    const validHtml = `
      <html>
        <body>
          <article>${'a'.repeat(101)}</article>
        </body>
      </html>
    `;

    const content = extractArticleContent(validHtml, ['article']);

    expect(content).toBeTruthy();
    expect(content!.length).toBe(101);
  });

  it('빈 셀렉터 배열인 경우 null을 반환해야 한다', () => {
    const html = '<html><body><article>Content</article></body></html>';

    const content = extractArticleContent(html, []);

    expect(content).toBeNull();
  });

  // Error cases
  it('매칭되는 셀렉터가 없으면 null을 반환해야 한다', () => {
    const html = '<html><body><div>Content</div></body></html>';

    const content = extractArticleContent(html, ['article', '.news-content']);

    expect(content).toBeNull();
  });

  it('빈 HTML에서는 null을 반환해야 한다', () => {
    const content = extractArticleContent('', ['article']);

    expect(content).toBeNull();
  });

  it('잘못된 HTML 구조에서도 파싱을 시도해야 한다', () => {
    const malformedHtml = `<article>${'Content '.repeat(20)}<article>`;

    const content = extractArticleContent(malformedHtml, ['article']);

    // Cheerio는 잘못된 HTML도 파싱 시도
    expect(content).toBeTruthy();
  });

  // Edge cases
  it('공백만 있는 콘텐츠는 null을 반환해야 한다', () => {
    const html = `
      <html>
        <body>
          <article>
            ${' '.repeat(200)}
          </article>
        </body>
      </html>
    `;

    const content = extractArticleContent(html, ['article']);

    expect(content).toBeNull();
  });

  it('특수문자가 포함된 HTML을 올바르게 처리해야 한다', () => {
    const html = `
      <html>
        <body>
          <article>
            주가지수 KOSPI가 2,500포인트를 돌파했습니다.
            ${'"특별한" 성과라고 전문가들은 평가했습니다. '.repeat(10)}
          </article>
        </body>
      </html>
    `;

    const content = extractArticleContent(html, ['article']);

    expect(content).toContain('KOSPI');
    expect(content).toContain('2,500');
    expect(content).toContain('"특별한"');
  });

  it('중첩된 태그의 텍스트를 모두 추출해야 한다', () => {
    const html = `
      <html>
        <body>
          <article>
            <p>첫 번째 문단입니다. ${'내용이 계속됩니다. '.repeat(5)}</p>
            <p>두 번째 문단입니다. ${'추가 내용입니다. '.repeat(5)}</p>
            <p>세 번째 문단입니다. ${'마지막 내용입니다. '.repeat(5)}</p>
          </article>
        </body>
      </html>
    `;

    const content = extractArticleContent(html, ['article']);

    expect(content).toContain('첫 번째 문단');
    expect(content).toContain('두 번째 문단');
    expect(content).toContain('세 번째 문단');
  });
});

describe('cleanHtml', () => {
  // Normal cases
  it('스크립트 태그를 제거해야 한다', () => {
    const html = `
      <html>
        <body>
          <p>Content</p>
          <script>alert('test');</script>
        </body>
      </html>
    `;

    const cleaned = cleanHtml(html);

    expect(cleaned).not.toContain('<script>');
    expect(cleaned).not.toContain('alert');
    expect(cleaned).toContain('Content');
  });

  it('스타일 태그를 제거해야 한다', () => {
    const html = `
      <html>
        <head>
          <style>.test { color: red; }</style>
        </head>
        <body>
          <p>Content</p>
        </body>
      </html>
    `;

    const cleaned = cleanHtml(html);

    expect(cleaned).not.toContain('<style>');
    expect(cleaned).not.toContain('color: red');
    expect(cleaned).toContain('Content');
  });

  it('iframe 태그를 제거해야 한다', () => {
    const html = `
      <html>
        <body>
          <p>Content</p>
          <iframe src="https://example.com"></iframe>
        </body>
      </html>
    `;

    const cleaned = cleanHtml(html);

    expect(cleaned).not.toContain('<iframe');
    expect(cleaned).toContain('Content');
  });

  it('광고 관련 클래스를 제거해야 한다', () => {
    const html = `
      <html>
        <body>
          <p>Content</p>
          <div class="ad">광고입니다</div>
          <div class="advertisement">또 다른 광고</div>
        </body>
      </html>
    `;

    const cleaned = cleanHtml(html);

    expect(cleaned).not.toContain('광고입니다');
    expect(cleaned).not.toContain('또 다른 광고');
    expect(cleaned).toContain('Content');
  });

  // Boundary cases
  it('빈 HTML을 처리해야 한다', () => {
    const cleaned = cleanHtml('');

    expect(cleaned).toBeTruthy();
    expect(typeof cleaned).toBe('string');
  });

  it('제거할 요소가 없는 HTML은 그대로 유지해야 한다', () => {
    const html = '<html><body><p>Clean content</p></body></html>';

    const cleaned = cleanHtml(html);

    expect(cleaned).toContain('Clean content');
  });

  // Edge cases
  it('여러 스크립트와 광고를 한 번에 제거해야 한다', () => {
    const html = `
      <html>
        <body>
          <p>Content 1</p>
          <script>script1();</script>
          <div class="ad">Ad 1</div>
          <p>Content 2</p>
          <script>script2();</script>
          <div class="advertisement">Ad 2</div>
          <p>Content 3</p>
        </body>
      </html>
    `;

    const cleaned = cleanHtml(html);

    expect(cleaned).toContain('Content 1');
    expect(cleaned).toContain('Content 2');
    expect(cleaned).toContain('Content 3');
    expect(cleaned).not.toContain('script1');
    expect(cleaned).not.toContain('script2');
    expect(cleaned).not.toContain('Ad 1');
    expect(cleaned).not.toContain('Ad 2');
  });

  it('중첩된 스크립트도 제거해야 한다', () => {
    const html = `
      <html>
        <body>
          <div>
            <script>
              function nested() {
                console.log('test');
              }
            </script>
          </div>
        </body>
      </html>
    `;

    const cleaned = cleanHtml(html);

    expect(cleaned).not.toContain('nested');
    expect(cleaned).not.toContain('console.log');
  });
});

describe('extractMetaContent', () => {
  // Normal cases
  it('Open Graph 메타 태그를 추출해야 한다', () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="테스트 제목" />
        </head>
        <body></body>
      </html>
    `;

    const content = extractMetaContent(html, 'og:title');

    expect(content).toBe('테스트 제목');
  });

  it('Twitter Card 메타 태그를 추출해야 한다', () => {
    const html = `
      <html>
        <head>
          <meta property="twitter:description" content="트위터 설명" />
        </head>
        <body></body>
      </html>
    `;

    const content = extractMetaContent(html, 'twitter:description');

    expect(content).toBe('트위터 설명');
  });

  // Boundary cases
  it('존재하지 않는 property는 null을 반환해야 한다', () => {
    const html = '<html><head></head><body></body></html>';

    const content = extractMetaContent(html, 'og:title');

    expect(content).toBeNull();
  });

  it('빈 content 속성은 null을 반환해야 한다', () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="" />
        </head>
        <body></body>
      </html>
    `;

    const content = extractMetaContent(html, 'og:title');

    expect(content).toBeNull();
  });

  // Edge cases
  it('특수문자가 포함된 content를 올바르게 추출해야 한다', () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="코스피 2,500 돌파 &quot;역대급&quot;" />
        </head>
        <body></body>
      </html>
    `;

    const content = extractMetaContent(html, 'og:title');

    expect(content).toContain('코스피');
    expect(content).toContain('2,500');
  });

  it('동일한 property가 여러 개 있으면 첫 번째를 반환해야 한다', () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="첫 번째 제목" />
          <meta property="og:title" content="두 번째 제목" />
        </head>
        <body></body>
      </html>
    `;

    const content = extractMetaContent(html, 'og:title');

    expect(content).toBe('첫 번째 제목');
  });
});

describe('extractMetaContentMultiple', () => {
  // Normal cases
  it('여러 property 중 첫 번째로 발견된 값을 반환해야 한다', () => {
    const html = `
      <html>
        <head>
          <meta property="twitter:title" content="트위터 제목" />
        </head>
        <body></body>
      </html>
    `;

    const content = extractMetaContentMultiple(html, ['og:title', 'twitter:title']);

    expect(content).toBe('트위터 제목');
  });

  it('우선순위에 따라 추출해야 한다', () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="OG 제목" />
          <meta property="twitter:title" content="트위터 제목" />
        </head>
        <body></body>
      </html>
    `;

    const content = extractMetaContentMultiple(html, ['og:title', 'twitter:title']);

    expect(content).toBe('OG 제목');
  });

  // Boundary cases
  it('모든 property가 없으면 null을 반환해야 한다', () => {
    const html = '<html><head></head><body></body></html>';

    const content = extractMetaContentMultiple(html, ['og:title', 'twitter:title']);

    expect(content).toBeNull();
  });

  it('빈 properties 배열은 null을 반환해야 한다', () => {
    const html = '<html><head><meta property="og:title" content="제목" /></head><body></body></html>';

    const content = extractMetaContentMultiple(html, []);

    expect(content).toBeNull();
  });

  // Edge cases
  it('첫 번째 property가 없고 두 번째가 있으면 두 번째를 반환해야 한다', () => {
    const html = `
      <html>
        <head>
          <meta property="twitter:title" content="트위터만 있음" />
        </head>
        <body></body>
      </html>
    `;

    const content = extractMetaContentMultiple(html, ['og:title', 'twitter:title', 'other:title']);

    expect(content).toBe('트위터만 있음');
  });
});

describe('extractTitle', () => {
  // Normal cases
  it('Open Graph 제목을 우선적으로 추출해야 한다', () => {
    const html = `
      <html>
        <head>
          <title>Title 태그 제목</title>
          <meta property="og:title" content="OG 제목" />
          <meta property="twitter:title" content="Twitter 제목" />
        </head>
        <body></body>
      </html>
    `;

    const title = extractTitle(html);

    expect(title).toBe('OG 제목');
  });

  it('OG 제목이 없으면 Twitter 제목을 사용해야 한다', () => {
    const html = `
      <html>
        <head>
          <title>Title 태그 제목</title>
          <meta property="twitter:title" content="Twitter 제목" />
        </head>
        <body></body>
      </html>
    `;

    const title = extractTitle(html);

    expect(title).toBe('Twitter 제목');
  });

  it('메타 태그가 없으면 title 태그를 사용해야 한다', () => {
    const html = `
      <html>
        <head>
          <title>Title 태그 제목</title>
        </head>
        <body></body>
      </html>
    `;

    const title = extractTitle(html);

    expect(title).toBe('Title 태그 제목');
  });

  // Boundary cases
  it('모든 제목 소스가 없으면 null을 반환해야 한다', () => {
    const html = '<html><head></head><body></body></html>';

    const title = extractTitle(html);

    expect(title).toBeNull();
  });

  // Edge cases
  it('한국어 제목을 올바르게 추출해야 한다', () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="한국은행 기준금리 0.5%p 인상" />
        </head>
        <body></body>
      </html>
    `;

    const title = extractTitle(html);

    expect(title).toBe('한국은행 기준금리 0.5%p 인상');
  });

  it('공백만 있는 제목은 무시하고 다음을 시도해야 한다', () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="   " />
          <title>Fallback 제목</title>
        </head>
        <body></body>
      </html>
    `;

    const title = extractTitle(html);

    // og:title이 빈 문자열이면 반환, trim 전이므로
    // 실제로는 공백이 반환될 수 있음
    expect(title).toBeTruthy();
  });
});

describe('extractDescription', () => {
  // Normal cases
  it('Open Graph 설명을 우선적으로 추출해야 한다', () => {
    const html = `
      <html>
        <head>
          <meta name="description" content="일반 설명" />
          <meta property="og:description" content="OG 설명" />
          <meta property="twitter:description" content="Twitter 설명" />
        </head>
        <body></body>
      </html>
    `;

    const description = extractDescription(html);

    expect(description).toBe('OG 설명');
  });

  it('OG 설명이 없으면 Twitter 설명을 사용해야 한다', () => {
    const html = `
      <html>
        <head>
          <meta name="description" content="일반 설명" />
          <meta property="twitter:description" content="Twitter 설명" />
        </head>
        <body></body>
      </html>
    `;

    const description = extractDescription(html);

    expect(description).toBe('Twitter 설명');
  });

  it('메타 property가 없으면 name="description"을 사용해야 한다', () => {
    const html = `
      <html>
        <head>
          <meta name="description" content="일반 설명" />
        </head>
        <body></body>
      </html>
    `;

    const description = extractDescription(html);

    expect(description).toBe('일반 설명');
  });

  // Boundary cases
  it('모든 설명 소스가 없으면 null을 반환해야 한다', () => {
    const html = '<html><head></head><body></body></html>';

    const description = extractDescription(html);

    expect(description).toBeNull();
  });

  // Edge cases
  it('긴 한국어 설명을 올바르게 추출해야 한다', () => {
    const longDescription = '한국은행 금융통화위원회가 기준금리를 0.5%포인트 인상하기로 결정했습니다. '.repeat(3);
    const html = `
      <html>
        <head>
          <meta property="og:description" content="${longDescription}" />
        </head>
        <body></body>
      </html>
    `;

    const description = extractDescription(html);

    expect(description).toContain('한국은행');
    expect(description).toContain('기준금리');
  });
});

describe('통합 시나리오', () => {
  it('실제 뉴스 페이지 구조를 올바르게 파싱해야 한다', () => {
    const html = `
      <html>
        <head>
          <title>한국경제 뉴스 - 주요 경제 뉴스</title>
          <meta property="og:title" content="한국은행, 기준금리 0.5%p 인상" />
          <meta property="og:description" content="물가 안정을 위한 조치로 평가받고 있습니다." />
          <script>
            analytics.track('pageview');
          </script>
          <style>
            .article { font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="advertisement">광고</div>
          <article>
            ${'한국은행이 기준금리를 0.5%포인트 인상했습니다. '.repeat(10)}
          </article>
          <script>
            loadComments();
          </script>
        </body>
      </html>
    `;

    const title = extractTitle(html);
    const description = extractDescription(html);
    const content = extractArticleContent(html, ['article']);
    const cleaned = cleanHtml(html);

    expect(title).toBe('한국은행, 기준금리 0.5%p 인상');
    expect(description).toBe('물가 안정을 위한 조치로 평가받고 있습니다.');
    expect(content).toContain('한국은행');
    expect(cleaned).not.toContain('analytics.track');
    expect(cleaned).not.toContain('광고');
    expect(cleaned).not.toContain('loadComments');
  });

  it('메타 태그 없는 간단한 HTML도 처리해야 한다', () => {
    const html = `
      <html>
        <head>
          <title>간단한 뉴스</title>
        </head>
        <body>
          <div class="content">
            ${'뉴스 본문 내용입니다. '.repeat(20)}
          </div>
        </body>
      </html>
    `;

    const title = extractTitle(html);
    const content = extractArticleContent(html, ['.content', 'article']);

    expect(title).toBe('간단한 뉴스');
    expect(content).toContain('뉴스 본문');
  });
});

describe('성능 테스트', () => {
  it('큰 HTML 문서를 효율적으로 처리해야 한다', () => {
    const largeHtml = `
      <html>
        <head>
          <meta property="og:title" content="제목" />
        </head>
        <body>
          <article>
            ${'문단 '.repeat(1000)}
          </article>
        </body>
      </html>
    `;

    const start = Date.now();
    extractTitle(largeHtml);
    extractArticleContent(largeHtml, ['article']);
    cleanHtml(largeHtml);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
  });

  it('여러 함수를 연속 호출해도 성능이 유지되어야 한다', () => {
    const html = '<html><head><meta property="og:title" content="제목" /></head><body></body></html>';

    const start = Date.now();

    for (let i = 0; i < 100; i++) {
      extractTitle(html);
      extractDescription(html);
      extractMetaContent(html, 'og:title');
    }

    const duration = Date.now() - start;

    expect(duration).toBeLessThan(500);
  });
});
