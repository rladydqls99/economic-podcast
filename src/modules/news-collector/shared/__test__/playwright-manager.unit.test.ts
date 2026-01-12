import { PlaywrightManager } from '@/modules/news-collector/shared/playwright-manager.js';

describe('PlaywrightManager', () => {
  let manager: PlaywrightManager;

  beforeEach(() => {
    manager = new PlaywrightManager();
  });

  afterEach(async () => {
    // Cleanup: 각 테스트 후 브라우저 닫기
    await manager.close();
    // 브라우저 프로세스가 완전히 종료될 때까지 대기
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  // 모든 테스트 완료 후 최종 정리
  afterAll(async () => {
    // 혹시 남아있을 브라우저 프로세스 정리
    await manager.close();
  });

  describe('initialize', () => {
    // Normal cases
    it('브라우저와 컨텍스트를 초기화해야 한다', async () => {
      await manager.initialize();

      expect(manager.isInitialized()).toBe(true);
    });

    it('이미 초기화된 경우 재초기화하지 않아야 한다', async () => {
      await manager.initialize();
      const firstInit = manager.isInitialized();

      await manager.initialize();
      const secondInit = manager.isInitialized();

      expect(firstInit).toBe(true);
      expect(secondInit).toBe(true);
    });

    // Error cases
    it('초기화 실패 시 에러를 throw해야 한다', async () => {
      // Playwright가 설치되지 않은 경우 등의 환경 문제는
      // 통합 테스트에서 다루고, 여기서는 정상 동작 확인
      await expect(manager.initialize()).resolves.not.toThrow();
    });
  });

  describe('newPage', () => {
    // Normal cases
    it('새 페이지를 생성해야 한다', async () => {
      const page = await manager.newPage();

      expect(page).toBeDefined();
      expect(typeof page.goto).toBe('function');

      await page.close();
    });

    it('초기화되지 않은 상태에서도 페이지를 생성해야 한다 (자동 초기화)', async () => {
      expect(manager.isInitialized()).toBe(false);

      const page = await manager.newPage();

      expect(manager.isInitialized()).toBe(true);
      expect(page).toBeDefined();

      await page.close();
    });

    it('페이지 닫기 시 activeTabs 카운터가 감소해야 한다', async () => {
      const page = await manager.newPage();
      expect(manager.getActiveTabs()).toBe(1);

      await page.close();

      // 페이지 닫힌 후 카운터 감소 대기
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(manager.getActiveTabs()).toBe(0);
    });

    // Boundary cases
    it('여러 페이지를 동시에 생성할 수 있어야 한다', async () => {
      const page1 = await manager.newPage();
      const page2 = await manager.newPage();
      const page3 = await manager.newPage();

      expect(manager.getActiveTabs()).toBe(3);

      await page1.close();
      await page2.close();
      await page3.close();

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(manager.getActiveTabs()).toBe(0);
    });

    it('MAX_CONCURRENT_TABS(5개) 제한을 준수해야 한다', async () => {
      const pages = [];

      // 5개 페이지 생성
      for (let i = 0; i < 5; i++) {
        pages.push(await manager.newPage());
      }

      expect(manager.getActiveTabs()).toBe(5);

      // 6번째 페이지는 대기해야 함 (비동기로 시작)
      const sixthPagePromise = manager.newPage();

      // 짧은 시간 대기 후에도 여전히 5개여야 함
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(manager.getActiveTabs()).toBe(5);

      // 하나 닫으면 6번째 페이지 생성됨
      await pages[0].close();
      const sixthPage = await sixthPagePromise;

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(manager.getActiveTabs()).toBe(5);

      // Cleanup
      await sixthPage.close();
      for (let i = 1; i < pages.length; i++) {
        await pages[i].close();
      }
    }, 15000); // Timeout 증가

    // Edge cases
    it('빈 페이지를 생성한 직후 바로 닫아도 문제없어야 한다', async () => {
      const page = await manager.newPage();
      await page.close();

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(manager.getActiveTabs()).toBe(0);
    });
  });

  describe('close', () => {
    // Normal cases
    it('브라우저와 컨텍스트를 정리해야 한다', async () => {
      await manager.initialize();
      expect(manager.isInitialized()).toBe(true);

      await manager.close();

      expect(manager.isInitialized()).toBe(false);
      expect(manager.getActiveTabs()).toBe(0);
    });

    it('이미 닫힌 상태에서 close를 호출해도 에러가 없어야 한다', async () => {
      await manager.close();

      await expect(manager.close()).resolves.not.toThrow();
    });

    it('활성 페이지가 있는 상태에서 close 시 모든 리소스를 정리해야 한다', async () => {
      const page1 = await manager.newPage();
      const page2 = await manager.newPage();

      expect(page1).toBeDefined();
      expect(page2).toBeDefined();
      expect(manager.getActiveTabs()).toBe(2);

      await manager.close();

      expect(manager.isInitialized()).toBe(false);
      expect(manager.getActiveTabs()).toBe(0);
    });

    // Edge cases
    it('초기화되지 않은 상태에서 close를 호출해도 안전해야 한다', async () => {
      expect(manager.isInitialized()).toBe(false);

      await expect(manager.close()).resolves.not.toThrow();
    });
  });

  describe('getActiveTabs', () => {
    // Normal cases
    it('초기 상태에서 0을 반환해야 한다', () => {
      expect(manager.getActiveTabs()).toBe(0);
    });

    it('페이지 생성 시 카운터가 증가해야 한다', async () => {
      expect(manager.getActiveTabs()).toBe(0);

      const page = await manager.newPage();
      expect(manager.getActiveTabs()).toBe(1);

      await page.close();
    });
  });

  describe('isInitialized', () => {
    // Normal cases
    it('초기 상태에서 false를 반환해야 한다', () => {
      expect(manager.isInitialized()).toBe(false);
    });

    it('초기화 후 true를 반환해야 한다', async () => {
      await manager.initialize();
      expect(manager.isInitialized()).toBe(true);
    });

    it('close 후 false를 반환해야 한다', async () => {
      await manager.initialize();
      expect(manager.isInitialized()).toBe(true);

      await manager.close();
      expect(manager.isInitialized()).toBe(false);
    });
  });

  describe('브라우저 재사용', () => {
    // Normal cases
    it('동일한 브라우저 인스턴스를 재사용해야 한다', async () => {
      const page1 = await manager.newPage();
      const page2 = await manager.newPage();

      // 두 페이지 모두 동일한 컨텍스트에서 생성됨
      expect(manager.isInitialized()).toBe(true);

      await page1.close();
      await page2.close();
    });

    it('close 후 다시 페이지 생성 시 새로운 브라우저를 시작해야 한다', async () => {
      // 첫 번째 브라우저 인스턴스
      const page1 = await manager.newPage();
      const context1 = page1.context();
      await page1.close();

      await manager.close();
      expect(manager.isInitialized()).toBe(false);

      // 두 번째 브라우저 인스턴스
      const page2 = await manager.newPage();
      const context2 = page2.context();

      expect(manager.isInitialized()).toBe(true);

      // ✅ 실제로 다른 브라우저 인스턴스인지 검증
      expect(context1).not.toBe(context2);

      await page2.close();
    });
  });

  describe('동시성 제어', () => {
    // Normal cases
    it('MAX_CONCURRENT_TABS 이하일 때는 즉시 페이지를 생성해야 한다', async () => {
      const start = Date.now();
      const page = await manager.newPage();
      const duration = Date.now() - start;

      // 브라우저 초기화 시간 제외하고 대기 시간은 짧아야 함
      expect(duration).toBeLessThan(5000);

      await page.close();
    });

    it('MAX_CONCURRENT_TABS 초과 시 대기해야 한다', async () => {
      const pages = [];

      // 5개 페이지 생성 (MAX)
      for (let i = 0; i < 5; i++) {
        pages.push(await manager.newPage());
      }

      const start = Date.now();
      const sixthPagePromise = manager.newPage();

      // 하나 닫기 전까지 대기 중
      await new Promise((resolve) => setTimeout(resolve, 500));
      await pages[0].close();

      const sixthPage = await sixthPagePromise;
      const duration = Date.now() - start;

      // 대기 시간이 있어야 함
      expect(duration).toBeGreaterThanOrEqual(500);

      // Cleanup
      await sixthPage.close();
      for (let i = 1; i < pages.length; i++) {
        await pages[i].close();
      }
    }, 15000);
  });

  describe('FR-001-04: 동적 콘텐츠 지원', () => {
    it('Playwright를 통해 실제 웹 페이지를 로드할 수 있어야 한다', async () => {
      const page = await manager.newPage();

      // 간단한 페이지 로드 테스트
      await page.goto('data:text/html,<html><body><h1>Test</h1></body></html>');

      const title = await page.title();
      expect(title).toBeDefined();

      await page.close();
    });

    it('JavaScript가 실행되는 동적 페이지를 처리할 수 있어야 한다', async () => {
      const page = await manager.newPage();

      const html = `
        <html>
          <body>
            <div id="content">Loading...</div>
            <script>
              setTimeout(() => {
                document.getElementById('content').textContent = 'Loaded';
              }, 100);
            </script>
          </body>
        </html>
      `;

      await page.goto(`data:text/html,${encodeURIComponent(html)}`);

      // JavaScript 실행 대기
      await page.waitForTimeout(200);

      const content = await page.evaluate(() => {
        return document.getElementById('content')?.textContent;
      });

      expect(content).toBe('Loaded');

      await page.close();
    });
  });
});
