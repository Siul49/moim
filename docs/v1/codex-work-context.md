# MOIM 개발 현황 인수인계

작성일: 2026-05-28

이 문서는 새 Codex 세션이 `C:\Users\kksu1\Dev\MOIM`에서 바로 맥락을 잡기 위한 작업 현황 노트다. 제품 설명서가 아니라, 현재 어디까지 왔고 무엇을 조심해야 하는지 정리한 handoff 문서다.

## 먼저 읽을 파일

1. `README.md`
   - 로컬 실행, 검증 명령, 현재 안정성 기준을 확인하는 첫 문서다.
2. `docs/README.md`
   - `docs/v1`과 `docs/v2`의 역할을 구분하는 문서 인덱스다.
3. `docs/v2/user-flow.md`
   - 최신 사용자 흐름과 수익화 연결안을 정리한 문서다.
4. `docs/v1/user-flow.md`
   - guest-first, 초대 링크 문맥 우선이라는 제품 원칙의 원본 기준 문서다.
5. `convention.md`
   - 커밋, 브랜치, 이슈, PR 규칙의 기준이다.
6. `ARCHITECTURE.md`
   - 코드 구조와 테스트 전략을 볼 때의 기준 문서다.
7. `prototype/moim.html`
   - 사용자 테스트용 단일 HTML 프로토타입의 중심 파일이다.

## 제품 방향

MOIM은 여러 사람이 모임 시간을 정할 때, 주최자가 링크를 만들고 참여자들이 가능한 시간을 제출하면 공통 가능한 시간을 추천해 주는 서비스다.

현재 가장 중요한 제품 원칙은 다음과 같다.

- 실제 제품 흐름은 `게스트 퍼스트 + 초대 링크 문맥 우선`이다.
- 초대 링크로 들어온 사용자는 바로 참여자 흐름으로 들어가야 한다.
- 로그인, 캘린더 저장, 계정 저장은 첫 관문이 아니라 가치를 경험한 뒤 제안한다.
- 사용자 테스트용 역할 허브는 테스트 장치다. 실제 제품 첫 화면으로 쓰면 안 된다.

MVP의 최소 흐름은 다음 순서가 기준이다.

1. 주최자가 모임을 만든다.
2. 초대 링크를 공유한다.
3. 참여자가 로그인 없이 가능한 시간을 제출한다.
4. 주최자가 추천 시간을 확인한다.
5. 주최자가 최종 시간을 확정한다.

## 현재 repo 상태

2026-05-28 확인 기준:

- repo root: `C:\Users\kksu1\Dev\MOIM`
- GitHub remote: `origin https://github.com/Siul49/moim.git`
- 기준 통합 브랜치: `dev`
- PR #16, #21, #26, #27, #29는 `dev`에 merge 완료
- 현재 레포 위생 정리 작업 이슈: #30

작업 시작 전에는 항상 아래를 다시 확인한다.

```powershell
git fetch origin --prune
git status --short --branch
gh pr list --state open --json number,title,headRefName,baseRefName,url
```

## 현재 구현 축

### 1. Next.js 앱

프로젝트는 Next.js App Router 기반이다.

주요 명령:

```powershell
npm ci
npm run lint
npm run test
npm run build
npm run test:e2e -- --project=chromium
```

`package.json` 기준 주요 스크립트:

- `npm run dev`: Next dev server
- `npm run test`: Vitest
- `npm run lint`: Next lint
- `npm run build`: production build
- `npm run test:e2e`: Playwright

### 2. 일정 생성/참여 플로우

현재 앱에는 Supabase 저장소와 별개로 브라우저 테스트 가능한 일정 생성/참여 플로우가 있다.

- `src/app/schedule/create/CreateScheduleClient.tsx`: 호스트가 모임을 만들고 참여자/호스트 링크를 받는다.
- `src/app/schedule/[id]/ScheduleRoomClient.tsx`: 참여자가 이름과 가능 시간을 제출하고, host token이 있으면 결과를 본다.
- `src/app/api/schedules/*`: 위 플로우를 위한 API route다.
- `src/lib/schedules/store.ts`: Prisma/SQLite-backed schedule store다. host token 원문은 저장하지 않고 hash만 저장한다.

이 저장소는 process memory가 아니라 로컬 SQLite DB에 남는다. Supabase-backed 운영 저장소로 확장할 때도 API contract를 유지하면서 저장소 구현과 배포 DB만 교체한다.

### 3. 캘린더/시간 계산

기준 모듈:

- `src/lib/scheduling/availability.ts`
- `src/lib/scheduling/free-slots.ts`
- `src/lib/scheduling/time-slot.ts`
- `src/lib/calendar/adapters/*`
- `src/lib/scheduling/ics-parser.ts`

Google/iCloud/수동 입력/ICS는 provider raw data를 표준 시간 표현으로 바꾼 뒤 공통 가용시간 계산으로 들어가는 구조다.

### 4. 인증/계정

현재 `dev`에는 이메일/닉네임 로그인, 회원가입, 카카오 로그인, Supabase/Prisma 관련 작업이 merge되어 있다. host auth와 participant guest flow는 분리해서 다룬다.

## 레포 위생 기준

- `.env`는 GitHub에 올리지 않는다. 필요한 키 이름만 `.env.example`에 둔다.
- `.claude/`, worktree, 로컬 실행 로그, 테스트 결과물은 추적하지 않는다.
- agent 전용 계획 문서는 기본적으로 레포에 남기지 않는다. 사람이 읽는 제품/개발 문서는 `docs/`에 직접 정리한다.
- 오래된 스켈레톤 파일은 실제 구현과 연결되어 있지 않으면 삭제한다.

## 다음 작업 추천 순서

1. 이슈 #30의 레포 위생/CI 정리를 완료하고 PR을 만든다.
2. `dev` 기준 CI가 `lint`, `test`, `build`, Chromium e2e를 모두 실행하는지 확인한다.
3. Supabase-backed 운영 저장소 전환을 별도 이슈로 분리한다.
4. 참여자 guest flow와 host auth flow가 섞이지 않도록 API와 UI 경계를 유지한다.

## 다음 세션 시작 프롬프트

```text
C:\Users\kksu1\Dev\MOIM에서 작업해줘.
먼저 README.md, docs/README.md, docs/v1/codex-work-context.md, convention.md를 읽고 현재 개발 현황과 협업 규칙을 파악해.
기존 작업트리에 수정/미추적 파일이 있으면 함부로 되돌리지 말고, git status와 GitHub PR 상태를 다시 확인해.
변경 후에는 npm run lint, npm run test, npm run build, 가능하면 npm run test:e2e -- --project=chromium으로 검증해.
```

## 주의할 점

- 이 문서는 snapshot이다. PR 상태와 CI 결과는 바뀔 수 있으므로 다음 세션에서 반드시 다시 확인한다.
- PowerShell에서 한글이 깨져 보이면 파일 문제라고 단정하지 말고 `Get-Content -Raw -Encoding UTF8`로 다시 읽는다.
- 문서/프로토타입은 한국어 톤을 유지한다. 과한 corporate wording보다 학생 팀이 실제로 설명하는 문장에 가깝게 쓴다.
