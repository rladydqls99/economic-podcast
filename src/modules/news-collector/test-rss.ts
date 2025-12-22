import { RSSCollector } from './rss-collector.js';

async function testRSSCollector() {
  console.log('🧪 RSS Collector 테스트 시작...\n');

  const collector = new RSSCollector();

  // 지난 24시간의 뉴스 수집
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

  console.log(`📅 수집 기간: ${startTime.toLocaleString('ko-KR')} ~ ${endTime.toLocaleString('ko-KR')}\n`);

  try {
    const res = await collector.collectNews(startTime, endTime);
    console.log('\n✅ 테스트 완료!');
    console.log(res);
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error);
  }
}

testRSSCollector();

//npx tsx src/modules/news-collector/test-rss.ts
