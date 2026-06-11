# 3. File Index Map
**현재 디렉터리 위치**: `C:\Users\kksu1\Dev\MOIM`

### 설정 파일 (루트)
| 파일 | 역할 |
|------|------|
| `package.json` | 의존성 & 스크립트 (dev, build, test, lint) |
| `tsconfig.json` | TypeScript 컴파일러 설정, `@/` 경로 별칭 |
| `tailwind.config.ts` | Tailwind v3 + shadcn HSL 디자인 토큰 |
| `vitest.config.ts` | 단위 테스트 러너 설정 (jsdom, 경로 별칭) |
| `playwright.config.ts` | E2E 테스트 설정 (Chromium, localhost:3000) |
| `.eslintrc.json` | ESLint 규칙 (underscore prefix 허용) |
| `commitlint.config.js` | 커밋 메시지 검증 규칙 |
| `components.json` | shadcn/ui CLI 설정 |

### 소스 코드 (`src/`)
| 경로 | 역할 |
|------|------|
| `src/app/layout.tsx` | 루트 레이아웃 (Geist 폰트, 메타데이터) |
| `src/app/page.tsx` | `/` 랜딩 페이지 |
| `src/app/globals.css` | 전역 CSS + 디자인 토큰 (HSL 변수) |
| `src/app/(auth)/layout.tsx` | 인증 전용 레이아웃 (GNB 없음) |
| `src/app/(auth)/login/page.tsx` | `/login` 소셜 로그인 페이지 |
| `src/app/schedule/create/page.tsx` | `/schedule/create` 일정 생성 |
| `src/app/schedule/[id]/page.tsx` | `/schedule/:id` 참여자 진입 |
| `src/components/ui/` | shadcn 원시 컴포넌트 |
| `src/components/schedule/TimeGrid.tsx` | When2meet 시간 그리드 (스켈레톤) |
| `src/components/schedule/ParticipantList.tsx` | 참여자 현황 (스켈레톤) |
| `src/components/schedule/AvailabilityResult.tsx` | 가용시간 결과 (스켈레톤) |
| `src/lib/scheduling/availability.ts` | ⭐ 가용시간 교집합 알고리즘 (구현 완료) |
| `src/lib/scheduling/ics-parser.ts` | .ics 파일 파서 (스켈레톤) |
| `src/lib/scheduling/time-slot.ts` | 시간 슬롯 유틸 (스켈레톤) |
| `src/lib/scheduling/__tests__/` | 단위 테스트 (availability 6개 통과) |
| `src/lib/supabase/client.ts` | Supabase 브라우저 클라이언트 (스켈레톤) |
| `src/lib/supabase/server.ts` | Supabase 서버 클라이언트 (스켈레톤) |
| `src/lib/utils.ts` | 공용 유틸리티 (cn 함수) |
| `src/types/schedule.ts` | 스케줄링 타입 (TimeSlot, ScheduleSession 등) |
| `src/types/user.ts` | 사용자/인증 타입 |
| `src/test-setup.ts` | Vitest 전역 설정 (jest-dom) |

### E2E 테스트 (`e2e/`)
| 파일 | 역할 |
|------|------|
| `e2e/host-flow.spec.ts` | 호스트 플로우 시나리오 (스켈레톤) |
| `e2e/participant-flow.spec.ts` | 참여자 플로우 시나리오 (스켈레톤) |

### CI/CD (`.github/`)
| 파일 | 역할 |
|------|------|
| `.github/workflows/pr-compliance.yml` | PR 템플릿 검사 + 코드 품질 검증 (lint→test→build) |
| `.github/workflows/issue-compliance.yml` | 이슈 템플릿 준수 검사 |

### 문서
| 파일 | 역할 |
|------|------|
| `ARCHITECTURE.md` | 프로젝트 구조 가이드 (팀원 공유용) |
| `convention.md` | 협업 컨벤션 가이드 (커밋, 브랜치, PR, 이슈) |
| `PRD.md` / `PRD.pdf` | 프로젝트 기획 및 요구사항 정의서 |
