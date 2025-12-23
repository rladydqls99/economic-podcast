/** @type {import('jest').Config} */
export default {
  // ===== 필수 ESM 설정 =====
  // TypeScript + ESM 조합을 위한 preset
  preset: 'ts-jest/presets/default-esm',

  // Node.js 환경에서 테스트 실행 (브라우저 아님)
  testEnvironment: 'node',

  // .ts 파일을 ESM으로 처리
  extensionsToTreatAsEsm: ['.ts'],

  // ===== Import 경로 해석 =====
  // TypeScript와 Jest가 경로를 찾도록 도움
  moduleNameMapper: {
    // 상대경로 .js → .ts로 변환 (예: './app.js' → './app.ts')
    '^(\\.{1,2}/.*)\\.js$': '$1',

    // @/ alias → src/로 변환 (예: '@/utils/date.js' → 'src/utils/date.ts')
    '^@/(.*)\\.js$': '<rootDir>/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // ===== TypeScript 변환 설정 =====
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },

  // ===== 테스트 파일 찾기 =====
  // tests 폴더 안의 *.test.ts 파일만 실행
  testMatch: ['**/tests/**/*.test.ts'],

  // ===== 기본 타임아웃 =====
  // 각 테스트가 10초 이상 걸리면 실패 (API 호출 테스트 대비)
  testTimeout: 10000,

  // ===== 테스트 시작 전 실행할 파일 =====
  // 전역 설정이나 mock 초기화 (현재: tests/setup.ts)
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
