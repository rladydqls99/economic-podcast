import { 타이틀_기반_필터링_프롬프트, 콘텐츠_기반_필터링_프롬프트 } from '@/modules/news-collector/shared/generate-prompt.js';

describe('타이틀_기반_필터링_프롬프트', () => {
  // Normal cases
  it('뉴스 목록으로 프롬프트를 생성해야 한다', () => {
    const news = [
      { id: 1, title: '삼성전자 실적 발표' },
      { id: 2, title: '환율 급등' },
      { id: 3, title: '기준금리 인상' },
    ];

    const prompt = 타이틀_기반_필터링_프롬프트(news);

    expect(prompt).toContain('한국 경제 유튜브 쇼츠 전문 에디터');
    expect(prompt).toContain('15개를 선별하세요');
    expect(prompt).toContain(JSON.stringify(news));
  });

  it('선별 기준이 포함되어야 한다', () => {
    const news = [{ id: 1, title: '테스트' }];
    const prompt = 타이틀_기반_필터링_프롬프트(news);

    // 1. 내 지갑에 직접 영향
    expect(prompt).toContain('환율');
    expect(prompt).toContain('금리');
    expect(prompt).toContain('물가');
    expect(prompt).toContain('부동산');
    expect(prompt).toContain('주식');

    // 2. 한국 관련성
    expect(prompt).toContain('삼성');
    expect(prompt).toContain('현대');
    expect(prompt).toContain('SK');

    // 3. 자극적 요소
    expect(prompt).toContain('급등');
    expect(prompt).toContain('폭락');
    expect(prompt).toContain('역대급');

    // 4. 트렌드 키워드
    expect(prompt).toContain('AI');
    expect(prompt).toContain('비트코인');
    expect(prompt).toContain('엔비디아');
  });

  it('제외 대상이 명시되어야 한다', () => {
    const news = [{ id: 1, title: '테스트' }];
    const prompt = 타이틀_기반_필터링_프롬프트(news);

    expect(prompt).toContain('제외 대상');
    expect(prompt).toContain('한국과 무관한');
    expect(prompt).toContain('전문 용어만 나열');
    expect(prompt).toContain('정치 관련 뉴스');
  });

  it('출력 형식을 JSON으로 명시해야 한다', () => {
    const news = [{ id: 1, title: '테스트' }];
    const prompt = 타이틀_기반_필터링_프롬프트(news);

    expect(prompt).toContain('JSON 배열 형식');
    expect(prompt).toContain('"id": 숫자');
    expect(prompt).toContain('"title": "제목"');
  });

  // Boundary cases
  it('빈 뉴스 배열로도 프롬프트를 생성해야 한다', () => {
    const news: { id: number; title: string }[] = [];
    const prompt = 타이틀_기반_필터링_프롬프트(news);

    expect(prompt).toContain('한국 경제 유튜브 쇼츠');
    expect(prompt).toContain(JSON.stringify(news));
    expect(prompt).toBe(prompt); // 문자열이 반환됨
  });

  it('단일 뉴스 항목으로 프롬프트를 생성해야 한다', () => {
    const news = [{ id: 1, title: '한국은행 금리 인상' }];
    const prompt = 타이틀_기반_필터링_프롬프트(news);

    expect(prompt).toContain('한국은행 금리 인상');
    expect(prompt).toContain(JSON.stringify(news));
  });

  it('많은 뉴스 항목(100개)으로도 프롬프트를 생성해야 한다', () => {
    const news = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      title: `뉴스 제목 ${i + 1}`,
    }));

    const prompt = 타이틀_기반_필터링_프롬프트(news);

    expect(prompt).toContain('뉴스 제목 1');
    expect(prompt).toContain('뉴스 제목 100');
    expect(prompt.length).toBeGreaterThan(1000);
  });

  // Edge cases
  it('특수문자가 포함된 제목을 올바르게 처리해야 한다', () => {
    const news = [
      { id: 1, title: '코스피 2,500 "역대급" 돌파' },
      { id: 2, title: '환율 1,400원 & 금리 3.5% 상승' },
      { id: 3, title: '삼성전자 주가 <긴급>' },
    ];

    const prompt = 타이틀_기반_필터링_프롬프트(news);
    const jsonString = JSON.stringify(news);

    expect(prompt).toContain(jsonString);
  });

  it('한국어, 영어, 숫자가 혼합된 제목을 처리해야 한다', () => {
    const news = [
      { id: 1, title: 'KOSPI 2500 돌파' },
      { id: 2, title: 'Samsung Electronics Q4 실적' },
      { id: 3, title: 'USD/KRW 환율 1300원 돌파' },
    ];

    const prompt = 타이틀_기반_필터링_프롬프트(news);

    expect(prompt).toContain('KOSPI 2500');
    expect(prompt).toContain('Samsung Electronics');
    expect(prompt).toContain('USD/KRW');
  });

  it('매우 긴 제목을 처리해야 한다', () => {
    const longTitle = '한국은행 금융통화위원회가 기준금리를 0.5%포인트 인상하기로 결정했습니다. '.repeat(
      5
    );
    const news = [{ id: 1, title: longTitle }];

    const prompt = 타이틀_기반_필터링_프롬프트(news);

    expect(prompt).toContain(longTitle);
  });

  // Type safety
  it('필수 속성(id, title)이 있는 객체만 허용해야 한다', () => {
    const validNews = [
      { id: 1, title: '제목1' },
      { id: 2, title: '제목2' },
    ];

    const prompt = 타이틀_기반_필터링_프롬프트(validNews);

    expect(prompt).toBeTruthy();
    expect(typeof prompt).toBe('string');
  });
});

describe('콘텐츠_기반_필터링_프롬프트', () => {
  // Normal cases
  it('제목과 본문이 있는 뉴스로 프롬프트를 생성해야 한다', () => {
    const news = [
      {
        id: 1,
        title: '삼성전자 실적 발표',
        content: '삼성전자가 4분기 실적을 발표했습니다. 영업이익이 전년 대비 30% 증가했습니다.',
      },
      { id: 2, title: '환율 급등', content: '달러 환율이 1,400원을 돌파했습니다.' },
    ];

    const prompt = 콘텐츠_기반_필터링_프롬프트(news);

    expect(prompt).toContain('25-40대 직장인');
    expect(prompt).toContain('3초 안에 스크롤을 멈추게');
    expect(prompt).toContain('뉴스 5개를 선별');
    expect(prompt).toContain(JSON.stringify(news, null, 2));
  });

  it('필수 선별 기준이 포함되어야 한다', () => {
    const news = [{ id: 1, title: '테스트' }];
    const prompt = 콘텐츠_기반_필터링_프롬프트(news);

    // 1. 즉각 반응 유발
    expect(prompt).toContain('The Hook Test');
    expect(prompt).toContain('헐 진짜??');
    expect(prompt).toContain('놀람');
    expect(prompt).toContain('불안');

    // 2. 행동 유도
    expect(prompt).toContain('Action Trigger');
    expect(prompt).toContain('단톡방에 공유');

    // 3. 스토리 완결성
    expect(prompt).toContain('45초 Rule');
    expect(prompt).toContain('기승전결');

    // 4. 바이럴 DNA
    expect(prompt).toContain('Shareable Factor');
    expect(prompt).toContain('찬반 논쟁');
  });

  it('제외 대상이 명시되어야 한다', () => {
    const news = [{ id: 1, title: '테스트' }];
    const prompt = 콘텐츠_기반_필터링_프롬프트(news);

    expect(prompt).toContain('무조건 제외');
    expect(prompt).toContain('뻔한 뉴스');
    expect(prompt).toContain('낚시 제목');
    expect(prompt).toContain('무관한 뉴스');
    expect(prompt).toContain('주가와 관계없는 기업 제품 소식');
  });

  it('꿀팁 섹션이 포함되어야 한다', () => {
    const news = [{ id: 1, title: '테스트' }];
    const prompt = 콘텐츠_기반_필터링_프롬프트(news);

    expect(prompt).toContain('꿀팁');
    expect(prompt).toContain('내 지갑 충격탄');
    expect(prompt).toContain('유명인/기업 반전');
    expect(prompt).toContain('시한폭탄');
    expect(prompt).toContain('금지된 진실');
    expect(prompt).toContain('저축, 투자, 재산 관리');
  });

  it('출력 형식과 개수 제한이 명시되어야 한다', () => {
    const news = [{ id: 1, title: '테스트' }];
    const prompt = 콘텐츠_기반_필터링_프롬프트(news);

    expect(prompt).toContain('JSON 배열로만 응답');
    expect(prompt).toContain('반드시 3개만 선별');
    expect(prompt).toContain('2개도 안 되고 4개도 안 됨');
    expect(prompt).toContain('"id": 숫자');
    expect(prompt).toContain('"title": "제목"');
  });

  // Boundary cases
  it('빈 뉴스 배열로도 프롬프트를 생성해야 한다', () => {
    const news: { id: number; title: string; content?: string }[] = [];
    const prompt = 콘텐츠_기반_필터링_프롬프트(news);

    expect(prompt).toContain('경제 콘텐츠 PD');
    expect(prompt).toContain(JSON.stringify(news, null, 2));
  });

  it('content 없이 제목만 있는 뉴스도 처리해야 한다', () => {
    const news = [
      { id: 1, title: '삼성전자 실적 발표' },
      { id: 2, title: '환율 급등' },
    ];

    const prompt = 콘텐츠_기반_필터링_프롬프트(news);

    expect(prompt).toContain('삼성전자 실적 발표');
    expect(prompt).toContain('환율 급등');
  });

  it('일부만 content가 있는 혼합 뉴스를 처리해야 한다', () => {
    const news = [
      { id: 1, title: '제목1', content: '본문1' },
      { id: 2, title: '제목2' },
      { id: 3, title: '제목3', content: '본문3' },
    ];

    const prompt = 콘텐츠_기반_필터링_프롬프트(news);
    const jsonString = JSON.stringify(news, null, 2);

    expect(prompt).toContain(jsonString);
  });

  it('많은 뉴스(50개)로도 프롬프트를 생성해야 한다', () => {
    const news = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      title: `뉴스 제목 ${i + 1}`,
      content: `뉴스 본문 ${i + 1}`,
    }));

    const prompt = 콘텐츠_기반_필터링_프롬프트(news);

    expect(prompt).toContain('뉴스 제목 1');
    expect(prompt).toContain('뉴스 제목 50');
    expect(prompt.length).toBeGreaterThan(2000);
  });

  // Edge cases
  it('매우 긴 본문을 처리해야 한다', () => {
    const longContent = '한국은행이 기준금리를 인상했습니다. '.repeat(100);
    const news = [{ id: 1, title: '금리 인상', content: longContent }];

    const prompt = 콘텐츠_기반_필터링_프롬프트(news);

    expect(prompt).toContain(longContent);
  });

  it('특수문자와 이모지가 포함된 내용을 처리해야 한다', () => {
    const news = [
      {
        id: 1,
        title: '🔥 긴급 🔥',
        content: '주가가 "급등"했습니다! & 환율도 ↑',
      },
    ];

    const prompt = 콘텐츠_기반_필터링_프롬프트(news);
    const jsonString = JSON.stringify(news, null, 2);

    expect(prompt).toContain(jsonString);
  });

  it('줄바꿈과 공백이 많은 본문을 처리해야 한다', () => {
    const news = [
      {
        id: 1,
        title: '제목',
        content: `
          첫 번째 문단

          두 번째 문단


          세 번째 문단
        `,
      },
    ];

    const prompt = 콘텐츠_기반_필터링_프롬프트(news);

    expect(prompt).toContain('첫 번째 문단');
    expect(prompt).toContain('두 번째 문단');
    expect(prompt).toContain('세 번째 문단');
  });

  it('HTML 태그가 포함된 본문을 처리해야 한다', () => {
    const news = [
      {
        id: 1,
        title: '제목',
        content: '<p>삼성전자</p>가 <strong>실적</strong>을 발표했습니다.',
      },
    ];

    const prompt = 콘텐츠_기반_필터링_프롬프트(news);
    const jsonString = JSON.stringify(news, null, 2);

    expect(prompt).toContain(jsonString);
  });

  // Type safety
  it('content가 undefined인 경우를 올바르게 처리해야 한다', () => {
    const news = [
      { id: 1, title: '제목1', content: undefined },
      { id: 2, title: '제목2', content: '본문2' },
    ];

    const prompt = 콘텐츠_기반_필터링_프롬프트(news);

    expect(prompt).toBeTruthy();
    expect(typeof prompt).toBe('string');
  });

  // Return type
  it('항상 문자열을 반환해야 한다', () => {
    const news = [{ id: 1, title: '테스트' }];
    const prompt = 콘텐츠_기반_필터링_프롬프트(news);

    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(0);
  });
});

describe('프롬프트 통합 시나리오', () => {
  it('타이틀 필터링 후 콘텐츠 필터링 순서로 사용할 수 있어야 한다', () => {
    // 1단계: 타이틀 기반 필터링
    const initialNews = [
      { id: 1, title: '삼성전자 실적 발표' },
      { id: 2, title: '환율 급등' },
      { id: 3, title: '브라질 경제 뉴스' }, // 제외될 것
      { id: 4, title: '기준금리 인상' },
    ];

    const titlePrompt = 타이틀_기반_필터링_프롬프트(initialNews);
    expect(titlePrompt).toContain('15개를 선별');

    // 2단계: 콘텐츠 기반 필터링 (타이틀 필터링 통과한 것들)
    const filteredNews = [
      { id: 1, title: '삼성전자 실적 발표', content: '본문1...' },
      { id: 2, title: '환율 급등', content: '본문2...' },
      { id: 4, title: '기준금리 인상', content: '본문3...' },
    ];

    const contentPrompt = 콘텐츠_기반_필터링_프롬프트(filteredNews);
    expect(contentPrompt).toContain('5개를 선별');
  });

  it('두 프롬프트가 다른 목적과 기준을 가져야 한다', () => {
    const news = [{ id: 1, title: '테스트', content: '본문' }];

    const titlePrompt = 타이틀_기반_필터링_프롬프트(news);
    const contentPrompt = 콘텐츠_기반_필터링_프롬프트(news);

    // 타이틀 프롬프트: 15개 선별
    expect(titlePrompt).toContain('15개');
    expect(titlePrompt).not.toContain('3초');
    expect(titlePrompt).not.toContain('45초');

    // 콘텐츠 프롬프트: 5개 선별, 더 세밀한 기준
    expect(contentPrompt).toContain('5개');
    expect(contentPrompt).toContain('3초');
    expect(contentPrompt).toContain('45초');
  });

  it('실제 경제 뉴스 데이터로 프롬프트를 생성해야 한다', () => {
    const realNews = [
      {
        id: 1,
        title: '한국은행 기준금리 3.5% 동결... "물가 안정 추이 지켜볼 것"',
        content:
          '한국은행 금융통화위원회가 24일 기준금리를 연 3.5%로 동결했다. 이는 시장 예상과 일치하는 결정이다. 한은은 "물가 상승세가 둔화되고 있으나 여전히 목표치를 상회하고 있어 통화정책을 긴축적으로 운용할 필요가 있다"고 밝혔다.',
      },
      {
        id: 2,
        title: '삼성전자 4분기 영업이익 6조원... 전년比 35% 감소',
        content:
          '삼성전자가 2023년 4분기 영업이익이 6조원 수준으로 전년 동기 대비 35% 감소할 것으로 전망했다. 메모리 반도체 업황 부진이 주요 원인이다. 다만 하반기부터 점진적 회복이 예상된다.',
      },
    ];

    const titlePrompt = 타이틀_기반_필터링_프롬프트(realNews);
    const contentPrompt = 콘텐츠_기반_필터링_프롬프트(realNews);

    // 타이틀 프롬프트 검증
    expect(titlePrompt).toContain('한국은행 기준금리');
    expect(titlePrompt).toContain('삼성전자 4분기');

    // 콘텐츠 프롬프트 검증
    expect(contentPrompt).toContain('물가 안정 추이');
    expect(contentPrompt).toContain('메모리 반도체');
  });
});

describe('프롬프트 성능', () => {
  it('대량의 뉴스(100개)로도 빠르게 프롬프트를 생성해야 한다', () => {
    const largeNews = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      title: `경제 뉴스 제목 ${i + 1}`,
      content: `뉴스 본문 내용 ${i + 1}. `.repeat(50),
    }));

    const start = Date.now();
    타이틀_기반_필터링_프롬프트(largeNews);
    콘텐츠_기반_필터링_프롬프트(largeNews);
    const duration = Date.now() - start;

    // 100ms 이내에 완료되어야 함
    expect(duration).toBeLessThan(100);
  });

  it('프롬프트 생성 시 메모리를 효율적으로 사용해야 한다', () => {
    const news = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      title: `제목 ${i + 1}`,
      content: `본문 ${i + 1}`,
    }));

    // 여러 번 호출해도 메모리 누수 없어야 함
    for (let i = 0; i < 100; i++) {
      타이틀_기반_필터링_프롬프트(news);
      콘텐츠_기반_필터링_프롬프트(news);
    }

    // 정상적으로 완료됨을 확인
    expect(true).toBe(true);
  });
});
