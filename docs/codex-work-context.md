# MOIM 개발 현황 인수인계

작성일: 2026-05-14

이 문서는 새 Codex 세션이 `C:\Users\kksu1\Dev\MOIM`에서 바로 맥락을 잡기 위한 작업 현황 노트다. 제품 설명서가 아니라, 현재 어디까지 왔고 무엇을 조심해야 하는지 정리한 handoff 문서다.

## 먼저 읽을 파일

1. `docs/codex-work-context.md`
   - 현재 개발 상태, 열린 PR, 다음 작업 순서를 빠르게 파악한다.
2. `docs/user-flow.md`
   - 실제 제품 흐름의 기준 문서다. 핵심 방향은 게스트 퍼스트, 초대 링크 문맥 우선이다.
3. `docs/superpowers/specs/2026-04-28-moim-role-based-user-test-prototype-design.md`
   - 사용자 테스트용 역할 기반 프로토타입의 승인된 설계 문서다.
4. `docs/superpowers/plans/2026-04-28-moim-role-based-user-test-prototype.md`
   - 역할 기반 프로토타입 구현 계획과 검증 흐름이 들어 있다.
5. `prototype/moim.html`
   - 현재 사용자 테스트용 단일 HTML 프로토타입의 중심 파일이다.

## 제품 방향

MOIM은 여러 사람이 모임 시간을 정할 때, 주최자가 링크를 만들고 참여자들이 가능한 시간을 제출하면 공통 가능한 시간을 추천해 주는 서비스다.

현재 가장 중요한 제품 원칙은 다음과 같다.

- 실제 제품 흐름은 `게스트 퍼스트 + 초대 링크 문맥 우선`이다.
- `/join/:id`처럼 초대 링크로 들어온 사용자는 바로 참여자 흐름으로 들어가야 한다.
- 일반 홈 `/`은 `모임 만들기`와 `초대 링크로 참여`를 중심으로 둔다.
- 로그인, 캘린더 저장, 계정 저장은 첫 관문이 아니라 가치를 경험한 뒤 제안한다.
- 사용자 테스트용 역할 허브는 테스트 장치다. 실제 제품 첫 화면으로 쓰면 안 된다.

MVP의 최소 흐름은 다음 순서가 기준이다.

1. 주최자가 모임을 만든다.
2. 초대 링크를 공유한다.
3. 참여자가 로그인 없이 가능한 시간을 제출한다.
4. 주최자가 추천 시간을 확인한다.
5. 주최자가 최종 시간을 확정한다.

## 현재 repo 상태

2026-05-14 확인 기준:

- repo root: `C:\Users\kksu1\Dev\MOIM`
- 현재 로컬 브랜치: `feat/prototype-user-test`
- 현재 HEAD: `d8e5dd1 feat: 역할 기반 사용자 테스트 프로토타입 개선`
- GitHub remote: `origin https://github.com/Siul49/moim.git`
- 기준 통합 브랜치: `dev`

현재 작업트리는 깨끗하지 않다. 다음 세션은 아래 변경을 사용자 작업으로 보고 함부로 되돌리면 안 된다.

수정됨:

- `.agents/docs/1_DOMAIN_CONTEXT.md`
- `.agents/docs/2_EXECUTION_PLAN.md`

미추적:

- `.claude/`
- `docs/provided-documents-summary.md`
- `docs/superpowers/plans/2026-04-27-moim-user-test-prototype.md`
- `docs/user-flow.md`
- `tsconfig.json`
- `docs/codex-work-context.md`

특히 `.agents/docs/*`와 `.claude/`는 다른 작업 흐름의 산출물일 수 있으므로, 명시 요청 없이 정리하지 않는다.

## 현재 구현 축

### 1. 사용자 테스트용 정적 프로토타입

중심 파일:

- `prototype/moim.html`

역할 기반 사용자 테스트 프로토타입은 네 관점을 한 파일에서 볼 수 있게 하는 방향이다.

- 게스트
- 로그인 유저
- 모임 만드는 사람
- 초대받아 참여하는 사람

이 역할 허브는 실제 제품의 정보 구조가 아니라 테스트용 진입 장치다. 실제 제품 첫 화면은 `docs/user-flow.md`의 게스트 퍼스트 흐름을 따른다.

### 2. Next.js 앱

프로젝트는 Next.js App Router 기반이다.

주요 명령:

```powershell
npm ci
npm test
npm run lint
npm run build
npm run test:e2e
```

`package.json` 기준 주요 스크립트:

- `npm run dev`: Next dev server
- `npm test`: Vitest
- `npm run lint`: Next lint
- `npm run build`: production build
- `npm run test:e2e`: Playwright

## 열린 PR 현황

2026-05-14 확인 기준 열린 PR은 2개다.

### PR #16

- URL: https://github.com/Siul49/moim/pull/16
- 제목: `feat(scheduling): 캘린더 통합 가용시간 산출 프레임워크 (Date 기반 어댑터)`
- base: `dev`
- head: `feature/15-availability-aggregation`
- GitHub merge 상태: `MERGEABLE`, `CLEAN`
- checks: 통과
- review decision: `CHANGES_REQUESTED`

로컬 검증 결과:

- `npm test`: 16 files, 125 tests 통과
- `npm run lint`: 통과
- `npm run build`: 통과

머지 판단:

- 충돌이나 기계적 실패는 없다.
- 다만 CodeRabbit이 남긴 Date 객체 aliasing, Google all-day parsing, manual adapter purity 같은 리뷰는 아직 남아 있다.
- 기반 scheduling 유틸이므로, 바로 머지하기보다는 작은 방어 수정 후 머지하는 편이 좋다.

우선 확인할 파일:

- `src/lib/scheduling/time-slot.ts`
- `src/lib/scheduling/free-slots.ts`
- `src/lib/calendar/adapters/google.ts`
- `src/lib/calendar/adapters/manual.ts`

### PR #21

- URL: https://github.com/Siul49/moim/pull/21
- 제목: `feat: 에브리타임 시간표 조회 기능 구현`
- base: `dev`
- head: `feature/20-everytime-timetable`
- GitHub merge 상태: `MERGEABLE`, `CLEAN`
- checks: 통과
- review decision: `CHANGES_REQUESTED`

로컬 검증 결과:

- `npm test`: 15 files, 123 tests 통과
- `npm run lint`: 통과
- `npm run build`: 통과

머지 판단:

- 충돌이나 기계적 실패는 없다.
- 실제 외부 입력을 받는 API라서 머지 전 보강이 더 중요하다.
- 특히 ICS 업로드 크기 제한, 내용 기반 ICS 검증, 시간 값 범위 검증, URL 입력 검증을 먼저 보는 것이 좋다.

우선 확인할 파일:

- `src/app/api/everytime/timetable/route.ts`
- `src/lib/everytime/url-scraper.ts`
- `src/lib/everytime/timetable.ts`
- `src/lib/everytime/ics-converter.ts`

### 두 PR 동시 머지 검증

임시 worktree에서 `origin/dev` 위에 PR #16, PR #21을 순서대로 merge 했을 때:

- merge conflict 없음
- `npm test`: 21 files, 157 tests 통과
- `npm run lint`: 통과
- `npm run build`: 통과

즉 통합 자체는 가능하지만, review gate는 아직 남아 있다.

## 다음 작업 추천 순서

1. 현재 작업트리 상태를 다시 확인한다.

```powershell
git status --short --branch
gh pr list --state open --json number,title,mergeable,mergeStateStatus,reviewDecision,statusCheckRollup,url
```

2. 사용자가 PR 정리를 원하면 PR #21부터 보는 것을 추천한다.

이유:

- Everytime API는 외부 URL, XML, ICS 파일을 직접 다룬다.
- validation 누락이 실제 운영 리스크로 이어질 가능성이 PR #16보다 높다.
- checks는 통과하지만 review decision은 아직 `CHANGES_REQUESTED`다.

3. PR #21 보강 시 최소 성공 기준:

- ICS 파일 크기 제한을 둔다.
- 파일명/MIME만 보지 말고 `BEGIN:VCALENDAR`, `END:VCALENDAR` 같은 내용 기반 확인을 한다.
- `startMinute`, `endMinute`, `day`는 finite number, 정수, 범위 조건을 검증한다.
- `timetableToFreeSlots` 오류와 scrape/parse 오류를 구분해서 응답한다.
- `npm test`, `npm run lint`, `npm run build`를 통과시킨다.

4. PR #16 보강 시 최소 성공 기준:

- `mergeOverlappingDateSlots`가 입력 Date 객체를 결과에 그대로 공유하지 않게 한다.
- `busyEventsToFree`의 empty busy path도 window Date 객체를 복사해서 반환한다.
- Google all-day parsing의 서버 로컬 timezone 의존성을 줄인다.
- `npm test`, `npm run lint`, `npm run build`를 통과시킨다.

5. 프로토타입 작업을 이어가면 `prototype/moim.html`과 `e2e/prototype-flow.spec.ts`를 함께 본다.

현재 역할 기반 프로토타입 문서의 방향은:

- 첫 화면은 사용자 테스트용 역할 허브
- 실제 제품 첫 화면은 게스트 퍼스트
- 참여자는 로그인 없이 제출 가능
- 주최자는 빠르게 링크를 만들고 공유 가능
- AI는 시간을 자동 확정하지 않고 추천만 한다

## 다음 세션 시작 프롬프트

새 세션에서 바로 이어가려면 아래처럼 시작하면 된다.

```text
C:\Users\kksu1\Dev\MOIM에서 작업해줘.
먼저 docs/codex-work-context.md를 읽고 현재 개발 현황을 파악해.
기존 작업트리에 수정/미추적 파일이 있으니 함부로 되돌리지 말고, git status와 열린 PR 상태를 다시 확인해.
우선순위는 PR #21 Everytime 시간표 기능의 merge-blocking 리뷰 보강이고, 필요하면 PR #16 scheduling 유틸 보강도 이어서 봐줘.
변경 후에는 npm test, npm run lint, npm run build로 검증해.
```

## 주의할 점

- 이 문서는 2026-05-14 시점의 snapshot이다. PR 상태와 CI 결과는 바뀔 수 있으므로 다음 세션에서 반드시 다시 확인한다.
- 기존 문서 중 일부는 PowerShell 출력에서 mojibake처럼 보일 수 있다. 문서 내용을 판단할 때는 `-Encoding UTF8`로 다시 읽는다.
- 로컬 `node_modules`가 현재 브랜치와 맞지 않으면 테스트가 잘못 실패할 수 있다. PR 검증은 깨끗한 worktree에서 `npm ci`부터 실행하는 편이 안전하다.
- 문서/프로토타입은 한국어 톤을 유지한다. 과한 corporate wording보다 학생 팀이 실제로 설명하는 문장에 가깝게 쓴다.
