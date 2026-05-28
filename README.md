# MOIM

MOIM은 주최자가 모임 링크를 만들고, 참여자가 로그인 없이 가능한 시간을 제출하면 공통 가능한 시간을 추천해 주는 일정 조율 앱입니다.

## 빠른 시작

```powershell
npm ci
npm run db:migrate
npm run dev
```

로컬 기본 DB는 `DATABASE_URL`이 없을 때 `file:./dev.db`를 사용합니다. 실제 배포나 공유 환경에서는 `.env.example`을 기준으로 `.env`를 준비하세요.

## 검증 명령

```powershell
npm run lint
npm run test
npm run test:coverage
npm run build
npm run test:e2e -- --project=chromium
```

`test`, `test:coverage`, `test:e2e`, `dev`는 실행 전에 로컬 SQLite schema를 보장합니다.

## 먼저 읽을 문서

1. `docs/README.md`: 현재 문서 기준과 v1/v2 구분
2. `docs/v2/user-flow.md`: 최신 사용자 흐름 및 수익화 연결안
3. `docs/v1/codex-work-context.md`: 현재 개발 handoff와 주의점
4. `ARCHITECTURE.md`: 코드 구조와 테스트 전략
5. `convention.md`: 커밋, 브랜치, 이슈, PR 규칙

## 현재 안정성 기준

- CI는 lint, unit test, build, Chromium E2E를 실행합니다.
- schedule 생성/참여 API는 process memory가 아니라 SQLite-backed Prisma store를 사용합니다.
- `.env`, 로컬 DB, Playwright 결과물, 문서 제출용 바이너리는 Git에 올리지 않습니다.
