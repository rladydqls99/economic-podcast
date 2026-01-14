import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { LIMITS } from '@/config/constants/timeouts.js';
import { AsyncQueue } from '@/utils/async-queue.js';

/**
 * Playwright 브라우저 풀 관리
 * - 브라우저 재사용으로 성능 향상
 * - 동시 요청 수 제한 (AsyncQueue 기반)
 * FR-001-04: 동적 콘텐츠 지원
 */
export class PlaywrightManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private readonly queue: AsyncQueue;

  constructor() {
    this.queue = new AsyncQueue(LIMITS.MAX_CONCURRENT_TABS);
  }

  /**
   * 브라우저 초기화
   * - headless 모드로 실행
   * - 샌드박스 비활성화 (서버 환경 호환성)
   * - 커스텀 User-Agent 설정
   */
  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      this.context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (compatible; EconomicPodcastBot/1.0)',
      });
    }
  }

  /**
   * 새 페이지 생성
   * - 동시 탭 수 제한 (AsyncQueue 기반 - 이벤트 드리븐)
   * - 페이지 닫힐 때 자동으로 슬롯 반환
   * @returns Playwright Page 인스턴스
   */
  async newPage(): Promise<Page> {
    if (!this.context) {
      await this.initialize();
    }

    // 슬롯 획득 대기 (이벤트 드리븐 방식)
    await this.queue.acquire();

    const page = await this.context!.newPage();

    // 페이지 닫힐 때 슬롯 반환
    page.on('close', () => {
      this.queue.release();
    });

    return page;
  }

  /**
   * 브라우저 및 컨텍스트 정리
   * - 모든 리소스 해제
   * - 메모리 누수 방지
   */
  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * 현재 활성 탭 수 조회 (테스트용)
   */
  getActiveTabs(): number {
    return this.queue.getActiveCount();
  }

  /**
   * 대기 중인 요청 수 조회 (테스트용)
   */
  getWaitingCount(): number {
    return this.queue.getWaitingCount();
  }

  /**
   * 브라우저 초기화 상태 확인 (테스트용)
   */
  isInitialized(): boolean {
    return this.browser !== null && this.context !== null;
  }
}

// 싱글톤 인스턴스
export const playwrightManager = new PlaywrightManager();
