import z from 'zod';

// =================================================================
// 뉴스 타입 정의
// =================================================================
export const NewsItemSchema = z.object({
  title: z.string().min(1), // 뉴스 제목 (필수)
  summary: z.string().min(1), // 요약/리드 (필수)
  url: z.url(), // 원문 링크 (필수)
  publishedAt: z.date(), // 발행 시간 (필수)
  source: z.string().min(1), // 언론사명 (필수)
  category: z.string().optional(), // 카테고리 (선택)
  content: z.string().optional(), // 기사 본문 (선택, Extractor에서 추가)
});

export type NewsItem = z.infer<typeof NewsItemSchema>;

export const isValidNewsItem = (item: NewsItem) => {
  const result = NewsItemSchema.safeParse(item);
  return result.success;
};

// =================================================================
// 뉴스 수집기 설정 타입 정의
// =================================================================
export const NewsCollectorConfigSchema = z.object({
  startTime: z.date(), // 수집 시작 시간 (FR-001-01: 당일 0시)
  endTime: z.date(), // 수집 종료 시간 (FR-001-01: 당일 22시)
  minNewsCount: z.number().min(1).default(20), // 최소 수집 뉴스 개수 (기본값: 20)
  similarityThreshold: z.number().min(0).max(1).default(0.9), // 중복 판단 유사도 임계값 (FR-001-05: 0.9)
});

export type NewsCollectorConfig = z.infer<typeof NewsCollectorConfigSchema>;

// =================================================================
// 뉴스 수집 결과 타입 정의
// =================================================================
export const CollectionResultSchema = z.object({
  success: z.boolean(), // 수집 성공 여부
  newsItems: z.array(NewsItemSchema), // 수집된 뉴스 아이템 배열
  totalCollected: z.number().min(0), // 총 수집된 뉴스 개수
  duplicatesRemoved: z.number().min(0), // 중복 제거된 뉴스 개수
  source: z.string().min(1), // 뉴스 소스 이름
  timestamp: z.date(), // 수집 완료 시간
  errors: z.array(z.string()).optional(), // 수집 중 발생한 오류 메시지 배열 (선택)
});

export type CollectionResult = z.infer<typeof CollectionResultSchema>;

// =================================================================
// 뉴스 소스 타입 정의
// =================================================================
export const NewsSourceSchema = z.object({
  name: z.string().min(1), // 뉴스 소스 이름
  type: z.enum(['RSS_FEED', 'GOOGLE_NEWS', 'NAVER']), // 뉴스 소스 타입
  url: z.string().min(1), // 뉴스 소스 URL
  enabled: z.boolean().default(true), // 뉴스 소스 활성화 여부
});

export type NewsSource = z.infer<typeof NewsSourceSchema>;
