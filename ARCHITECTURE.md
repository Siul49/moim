# MOIM 프로젝트 아키텍처 가이드

> 이 문서는 프로젝트의 전체 폴더 구조와 각 디렉토리의 역할을 설명합니다.
> 팀원이 프로젝트에 처음 합류했을 때 "어디서 뭘 하면 되는지"를 빠르게 파악하기 위한 지도입니다.

---

## 기술 스택 요약

| 영역 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router) | 14 |
| 언어 | TypeScript | 5.x |
| 스타일링 | Tailwind CSS + shadcn/ui | v3 |
| 단위 테스트 | Vitest + React Testing Library | - |
| E2E 테스트 | Playwright | - |
| 백엔드 | Supabase (PostgreSQL + Auth + Realtime) | - |
| 배포 | Vercel | - |

---

## 폴더 구조

```
MOIM/
├── 📁 src/                        # 소스 코드 루트
│   ├── 📁 app/                    # Next.js App Router — 페이지 라우팅
│   │   ├── 📁 (auth)/             # 인증 관련 페이지 그룹
│   │   │   ├── layout.tsx         # 인증 전용 레이아웃 (GNB 없음)
│   │   │   └── 📁 login/          # /login → 소셜 로그인 페이지
│   │   ├── 📁 schedule/           # 스케줄링 핵심 도메인
│   │   │   ├── 📁 create/         # /schedule/create → 호스트가 일정 생성
│   │   │   └── 📁 [id]/           # /schedule/:id → 참여자가 링크로 진입
│   │   ├── layout.tsx             # 루트 레이아웃
│   │   ├── page.tsx               # / → 랜딩 페이지
│   │   └── globals.css            # 전역 CSS + 디자인 토큰
│   │
│   ├── 📁 components/             # 재사용 가능한 UI 컴포넌트
│   │   ├── 📁 ui/                 # shadcn/ui 원시 컴포넌트 (Button, Card 등)
│   │   └── 📁 schedule/           # 스케줄링 도메인 전용 컴포넌트
│   │       ├── TimeGrid.tsx       # When2meet 스타일 시간 선택 그리드
│   │       ├── ParticipantList.tsx # 참여자 현황 목록
│   │       └── AvailabilityResult.tsx # 공통 가용시간 결과
│   │
│   ├── 📁 lib/                    # 비즈니스 로직 & 유틸리티
│   │   ├── 📁 scheduling/         # ⭐ 핵심 알고리즘 (순수 함수)
│   │   │   ├── availability.ts    # 가용시간 교집합 연산
│   │   │   ├── ics-parser.ts      # .ics 파일 파싱
│   │   │   ├── time-slot.ts       # 시간 슬롯 유틸 (정렬, 병합)
│   │   │   └── 📁 __tests__/      # 단위 테스트 (코로케이션)
│   │   ├── 📁 supabase/           # Supabase DB 클라이언트
│   │   │   ├── client.ts          # 브라우저용 클라이언트
│   │   │   └── server.ts          # 서버 사이드 클라이언트
│   │   └── utils.ts               # 공용 유틸리티
│   │
│   ├── 📁 types/                  # TypeScript 타입 정의
│   │   ├── schedule.ts            # 스케줄링 도메인 타입
│   │   └── user.ts                # 사용자/인증 타입
│   │
│   └── test-setup.ts              # Vitest 전역 설정
│
├── 📁 e2e/                        # Playwright E2E 테스트
│   ├── host-flow.spec.ts          # 호스트 플로우 시나리오
│   └── participant-flow.spec.ts   # 참여자 플로우 시나리오
│
├── 📁 .github/                    # GitHub 자동화
│   └── 📁 workflows/              # CI/CD 파이프라인
│
├── vitest.config.ts               # Vitest 설정
├── playwright.config.ts           # Playwright 설정
├── tailwind.config.ts             # Tailwind CSS 설정
├── tsconfig.json                  # TypeScript 설정
└── package.json                   # 의존성 & 스크립트
```

---

## 핵심 설계 원칙과 근거

### 1. `src/app/` — 라우팅은 사용자 플로우를 반영한다

Next.js App Router의 **파일 = URL** 규칙을 활용하여, PRD의 사용자 플로우를 그대로 폴더로 표현합니다.

| URL | 파일 | PRD 매핑 |
|-----|------|----------|
| `/login` | `(auth)/login/page.tsx` | 3.1 로그인/회원가입 |
| `/schedule/create` | `schedule/create/page.tsx` | 3.1 일정 잡기 생성 |
| `/schedule/:id` | `schedule/[id]/page.tsx` | 3.2~3.3 참여자 진입 |

**`(auth)` 괄호 그룹이란?**
Next.js에서 폴더명을 괄호로 감싸면 URL에 영향을 주지 않고 레이아웃만 분리할 수 있습니다.
- `/login`의 URL은 그대로지만, 별도의 `layout.tsx`를 가져 GNB가 없는 레이아웃을 사용합니다.

**`[id]` 동적 라우트란?**
대괄호로 감싼 폴더는 URL의 일부를 변수로 받습니다.
- `/schedule/abc123` → `params.id = 'abc123'`

### 2. `src/components/` — UI는 범용과 도메인으로 분리한다

```
components/
├── ui/        ← shadcn 원시 컴포넌트 (프로젝트 무관하게 재사용)
└── schedule/  ← 우리 서비스 전용 컴포넌트 (비즈니스 로직 포함)
```

- `ui/`: 버튼, 카드, 모달 등 어떤 프로젝트에서든 쓸 수 있는 범용 컴포넌트
- `schedule/`: TimeGrid, ParticipantList 등 MOIM 서비스에만 존재하는 컴포넌트

### 3. `src/lib/scheduling/` — 핵심 로직은 UI와 분리한다

가용시간 교집합 연산, .ics 파싱 등은 **React와 무관한 순수 함수**입니다.
UI 없이 독립적으로 실행되므로, 테스트가 빠르고 정확합니다.

```typescript
// 이렇게 React 없이 단독으로 테스트 가능
const result = findCommonSlots([userA, userB])
expect(result).toEqual([{ day: 'MON', startHour: 13, endHour: 15 }])
```

**왜 분리하나?**
- 순수 함수는 입력→출력만 검증하면 되므로 TDD에 최적
- 브라우저 환경(jsdom)이 필요 없어 테스트가 10배 빨라짐
- 나중에 서버 사이드에서도 같은 로직을 재사용 가능

### 4. `__tests__/` 코로케이션 — 테스트는 대상 코드 바로 옆에

```
lib/scheduling/
├── availability.ts          ← 구현
└── __tests__/
    └── availability.test.ts ← 테스트
```

**왜 루트 `tests/` 폴더가 아니라 코드 옆에 두는가?**
- 파일 탐색 시 구현과 테스트를 한눈에 볼 수 있음
- 새 기능 추가 시 "테스트 파일은 어디 만들지?" 고민이 없음
- AI 도구에게 "이 파일 테스트해줘"라고 할 때 컨텍스트 파악이 빠름

### 5. `src/types/` — 타입 정의를 먼저, 구현은 나중에 (TDD)

```
1. types/schedule.ts   → "어떤 데이터를 다루는가?" 정의
2. __tests__/*.test.ts → "어떻게 동작해야 하는가?" 테스트 작성
3. lib/scheduling/*.ts → 테스트를 통과시키는 구현
```

이 순서가 TDD(Test-Driven Development)의 핵심입니다.
Python에서 Pydantic 모델 → pytest 테스트 → 비즈니스 로직 순서와 동일합니다.

---

## 테스트 전략

### 3계층 테스트 (Testing Trophy)

| 계층 | 도구 | 대상 | 비중 |
|------|------|------|------|
| **Unit** | Vitest | `lib/scheduling/` 순수 로직 | 50% |
| **Integration** | React Testing Library + Vitest | `components/` 상호작용 | 30% |
| **E2E** | Playwright | 사용자 전체 플로우 | 20% |

### 테스트 실행 명령어

| 명령어 | 용도 |
|--------|------|
| `npm run test` | 모든 단위 테스트 한 번 실행 (CI용) |
| `npm run test:watch` | 파일 저장 시 자동 재실행 (개발용) |
| `npm run test:coverage` | 커버리지 리포트와 함께 실행 |
| `npm run test:e2e` | 브라우저 E2E 테스트 실행 |

### TDD 워크플로우

```
1. 타입 정의  → types/에 인터페이스 작성
2. 테스트 작성 → 실패하는 테스트 먼저 (Red)
3. 최소 구현  → 테스트를 통과시키는 코드 (Green)
4. 리팩터링   → 코드 정리 (Refactor)
5. CI 검증   → PR 시 자동 테스트 실행
```

---

## CI/CD 파이프라인

PR을 올리면 아래 검사가 자동으로 실행됩니다:

```
PR 생성 → 템플릿 검사 → 린트(npm run lint)
                      → 테스트(npm run test)  
                      → 빌드(npm run build)   
                      → 모두 ✅ → Merge 가능
```

하나라도 ❌이면 Merge 버튼이 비활성화됩니다.
