# Economic Podcast - 프로젝트 가이드

## 📋 프로젝트 개요

**경제 뉴스 자동 팟캐스트 생성 시스템**

- **목적**: 경제 뉴스를 자동으로 수집하고 팟캐스트로 변환
- **주요 기능**: RSS/Google News 크롤링, 뉴스 분석, 팟캐스트 생성
- **작성자**: yongbin Kim

## 🛠️ 기술 스택

### Core

- **Runtime**: Node.js (ESM)
- **Language**: TypeScript 5.9.3
- **Package Manager**: pnpm 10.9.0

### Main Dependencies

- **Web Framework**: Express 5.2.1
- **HTTP Client**: Axios 1.13.2
- **Web Scraping**: Cheerio 1.1.2, Playwright 1.57.0
- **RSS Parsing**: rss-parser 3.13.0
- **AI**: OpenAI 6.14.0
- **Scheduling**: node-cron 4.2.1
- **Validation**: Zod 4.2.1
- **Text Analysis**: string-similarity 4.0.4

### Development Tools

- **Testing**: Jest 30.2.0 (ts-jest, supertest)
- **Linting**: ESLint 9.39.2 (typescript-eslint, eslint-plugin-security)
- **Formatting**: Prettier 3.7.4
- **Git Hooks**: Husky 9.1.7
- **Build**: tsc, tsc-alias

## 📁 프로젝트 구조

```
economic-podcast/
├── src/
│   ├── config/           # 환경 설정
│   ├── types/            # TypeScript 타입 정의
│   ├── utils/            # 유틸리티 함수
│   ├── modules/          # 주요 기능 모듈
│   │   └── news-collector/
│   │       ├── rss/      # RSS 뉴스 수집
│   │       ├── google-news/  # Google News 수집
│   │       ├── naver-news/   # Naver News 수집
│   │       └── shared/       # 공유 로직
│   ├── data/             # 데이터 저장소
│   ├── logs/             # 로그 파일
│   ├── app.ts            # Express 앱 설정
│   └── server.ts         # 서버 엔트리포인트
├── tests/
│   ├── e2e/              # E2E 테스트
│   └── setup.ts          # 테스트 설정
├── docs/
│   └── plan/             # 기획 문서
└── [설정 파일들]
```

## ⚙️ TypeScript 설정

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"] // Path alias: @/ → src/
    }
  }
}
```

**주요 특징**:

- ESM 모듈 시스템 사용 (`"type": "module"`)
- Path alias `@/*` 사용 (예: `@/utils/date-time.ts`)
- Strict 모드 활성화

## 🧪 테스트 설정

### Jest 구성

```javascript
// jest.config.js
{
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',       // .js → .ts 변환
    '^@/(.*)\\.js$': '<rootDir>/src/$1', // @/ alias 지원
    '^@/(.*)$': '<rootDir>/src/$1'
  }
}
```

### 테스트 명령어

```bash
pnpm test              # 모든 테스트 실행
pnpm test:watch        # Watch 모드
pnpm test:coverage     # 커버리지 포함
pnpm test:unit         # 유닛 테스트만
pnpm test:integration  # 통합 테스트만
pnpm test:e2e          # E2E 테스트만
pnpm test:ci           # CI 환경용
```

### 테스트 파일 구조

- **유닛 테스트**: `src/**/__test__/*.unit.test.ts`
- **통합 테스트**: `src/**/__test__/*.integration.test.ts`
- **E2E 테스트**: `tests/e2e/**/*.test.ts`

## 🎨 코드 스타일

### ESLint (eslint.config.mts)

```typescript
export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  securitylint.configs.recommended, // 보안 규칙
  prettierConfig,
];
```

**특징**:

- Flat config 방식 사용
- TypeScript ESLint 규칙
- 보안 취약점 검사 (eslint-plugin-security)
- Prettier와 통합

### Prettier (.prettierrc)

```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 120,
  "tabWidth": 2,
  "useTabs": false,
  "trailingComma": "es5",
  "arrowParens": "always"
}
```

## 🔒 Git Hooks (Husky)

### pre-commit

```bash
pnpm lint        # 린트 검사
pnpm test:unit   # 유닛 테스트 실행
```

**커밋 전 자동 검증**:

1. 코드 스타일 및 보안 검사
2. 유닛 테스트 통과 확인

## 🚀 스크립트 명령어

### 개발

```bash
pnpm dev           # 개발 서버 (tsx watch)
pnpm build         # 프로덕션 빌드 (tsc + tsc-alias)
pnpm start         # 프로덕션 실행
```

### 코드 품질

```bash
pnpm lint          # ESLint 검사
pnpm lint:fix      # ESLint 자동 수정
```

### 테스트

위 테스트 명령어 참조

## 🔧 개발 환경 설정

### 환경 변수 (.env)

프로젝트 루트에 `.env` 파일 생성 (`.env.example` 참조)

### 필수 도구

- Node.js (ES2020 지원)
- pnpm 10.9.0+
- TypeScript 5.9.3

## 📝 코딩 컨벤션

### Import 스타일

```typescript
// ESM 방식: 확장자 .js 필수 (런타임에 .ts → .js 변환됨)
import { something } from './module.js';
import { util } from '@/utils/helper.js';
```

### 파일 구조

```
module/
├── __test__/
│   ├── feature.unit.test.ts       # 유닛 테스트
│   └── feature.integration.test.ts # 통합 테스트
├── types.ts                        # 타입 정의
├── collector.ts                    # 메인 로직
└── index.ts                        # 내보내기
```

## 🎯 주요 모듈

### News Collector

- **RSS Collector**: RSS 피드에서 뉴스 수집
- **Google News Collector**: Google News 크롤링
- **Naver News Collector**: (구현 예정)

### Utils

- **date-time**: 날짜/시간 유틸리티
- **text-similarity**: 텍스트 유사도 분석

## 📚 참고 자료

### 문서

- [docs/plan/](docs/plan/): 구현 계획 문서

### Claude Code 작업 시 유의사항

1. **Import 경로**: ESM 방식이므로 `.js` 확장자 필수
2. **Path Alias**: `@/` 사용 가능 (예: `@/utils/date-time.js`)
3. **테스트**: 코드 작성 시 유닛 테스트 함께 작성
4. **Pre-commit**: 커밋 전 자동으로 lint + test 실행됨
5. **보안**: `eslint-plugin-security`로 보안 취약점 검사

### 새 기능 추가 시

1. `src/modules/` 하위에 모듈 디렉토리 생성
2. 타입 정의 (`types.ts`)
3. 메인 로직 구현
4. `__test__/` 디렉토리에 테스트 작성
   - `*.unit.test.ts`: 유닛 테스트
   - `*.integration.test.ts`: 통합 테스트
5. `pnpm test` 실행하여 검증
6. Commit (자동으로 pre-commit hook 실행)

---

**마지막 업데이트**: 2026-01-03
