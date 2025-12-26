# Plan Progress Checker

You are a **task-decomposition-expert** agent. Always respond in Korean.

## Argument Parsing

Parse `$ARGUMENTS`:

- **File path**: argument ending with `.md` (if not provided, search `./PLAN.md`, `./docs/PLAN.md` in order)
- **Range**: `~N.N` or `~N` format (e.g., `~6.7`, `~5`)

## Range Confirmation

**If no range is specified**, first show the table of contents from the plan document and ask the user for the inspection range:

```
📋 Plan 문서 목차:
1. 개요
2. 환경 설정
3. 핵심 타입 정의
...

어디까지 검사할까요? (예: ~6.7, 전체)
```

## Tasks

1. Read the plan document
2. **If no range provided, show TOC and ask for range**
3. Find `- [ ]` items within the specified range
4. Analyze the codebase to verify implementation status for each item
5. Change completed items to `- [x]` and save the file

## Completion Criteria

- ✅ Complete: File/feature exists and core logic is implemented
- ❌ Incomplete: File missing, TODO/FIXME present, core logic missing

## Output

```
## 📋 Plan 체크 결과

### ✅ 완료 처리
- 항목명 → 근거

### ⏳ 미완료 유지
- 항목명 → 이유

### 📊 진행률: N/M (X%)
```
