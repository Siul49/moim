# 1. Domain Context
**프로젝트 명**: AI 캠퍼스 모임 (MVP 1차)
**핵심 목표**: 에브리타임 시간표와 캘린더 연동을 통해 대학생들의 공통적인 빈 시간을 자동으로 탐색하고 일정을 잡아주는 프론트엔드 환경 구축
**핵심 스택**: `Next.js 14`, `React`, `TypeScript`, `Tailwind CSS v3`, `shadcn/ui`, `Vitest`, `Playwright`

### 주요 도메인

| 도메인 | 설명 | 핵심 파일 |
|--------|------|-----------|
| 스케줄링 | 가용시간 교집합, .ics 파싱, 시간 슬롯 관리 | `src/lib/scheduling/` |
| 인증 | 카카오/구글 소셜 로그인, Supabase Auth | `src/app/(auth)/`, `src/lib/supabase/` |
| UI 컴포넌트 | TimeGrid, ParticipantList 등 도메인 전용 | `src/components/schedule/` |

### 주요 변경 사항
- Next.js 14버전 초기화 및 App 라우터 아키텍처 스캐폴딩 구성 완료 (2026.04.14)
- TDD 기반 프로젝트 구조 수립: Vitest + RTL + Playwright 도입, PRD 기반 폴더 스켈레톤 생성 (2026.04.15)
- Tailwind v3 + shadcn/ui HSL 디자인 토큰 체계 정립 (2026.04.15)
- CI 파이프라인에 lint → test → build 검증 단계 추가 (2026.04.15)
