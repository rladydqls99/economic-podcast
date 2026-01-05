export interface NoisePattern {
  name: string;
  pattern: RegExp;
  description: string;
}

export const NOISE_PATTERNS: NoisePattern[] = [
  // 1. 광고 문구
  {
    name: 'advertisement',
    pattern: /\[광고\]|\(광고\)|AD|Sponsored/gi,
    description: '광고 표시 제거',
  },

  // 2. 페이월 안내
  {
    name: 'paywall',
    pattern: /유료회원|구독하시면|프리미엄 회원|로그인 후|기사 전문/gi,
    description: '페이월 관련 문구 제거',
  },

  // 3. 저작권 표시
  {
    name: 'copyright',
    pattern: /ⓒ|©|저작권자|무단전재|재배포금지/gi,
    description: '저작권 표시 제거',
  },

  // 4. 기자 정보
  {
    name: 'reporter',
    pattern: /기자\s*=|작성자:|글:\s*\w+/gi,
    description: '기자 정보 제거',
  },

  // 5. 날짜/시간 스탬프
  {
    name: 'timestamp',
    pattern: /\d{4}년\s*\d{1,2}월\s*\d{1,2}일|\d{4}-\d{2}-\d{2}/g,
    description: '날짜 스탬프 제거',
  },

  // 6. HTML 태그 잔여물
  {
    name: 'html_tags',
    pattern: /<[^>]*>|&nbsp;|&lt;|&gt;|&amp;/gi,
    description: 'HTML 태그 제거',
  },

  // 7. 이메일 주소
  {
    name: 'email',
    pattern: /[\w.-]+@[\w.-]+\.\w+/g,
    description: '이메일 주소 제거',
  },

  // 8. SNS 공유 문구
  {
    name: 'social_share',
    pattern: /페이스북|트위터|카카오톡|공유하기|좋아요/gi,
    description: 'SNS 공유 문구 제거',
  },

  // 9. 푸터 정보
  {
    name: 'footer',
    pattern: /관련기사|이 기사|더보기|사진제공|출처:/gi,
    description: '푸터 정보 제거',
  },

  // 10. 과도한 공백
  {
    name: 'whitespace',
    pattern: /\s{2,}/g,
    description: '연속 공백 제거',
  },

  // 11. 특수문자 남용
  {
    name: 'special_chars',
    pattern: /[★☆■□▲▶◆●◇◎]/g,
    description: '특수문자 제거',
  },
];
