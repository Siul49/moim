# UI/UX 화면 보완 및 모바일 최적화 구현 계획서 (docs/MOIM_role_screen 시안 기반)

본 계획서는 `docs/MOIM_role_screen` 폴더 내의 20개 모바일/데스크톱 화면 시안과 현재 Next.js 애플리케이션 구현 상태 간의 갭(Gap)을 분석하고, 시안에 일치하는 모바일 최적화 화면 및 추가 페이지 구현 계획을 수립합니다.

---

## 1. 현황 및 갭 분석 (Gap Analysis)

현재 Next.js 기반 실제 프로젝트는 핵심 모임 개설 및 드래그 가용시간 수집, Supabase 연동 부근의 API와 유닛 테스트가 견고하게 완료되었으나, 기획된 UI 시안(20개 스크린) 대비 아래와 같은 세부 화면 및 유저 동선 상의 공백이 있습니다.

| 시안 범위 | 시안 명칭 | 현재 구현 상태 및 갭 (Gap) |
|---|---|---|
| **게스트 진입 및 소개**<br>(01~05) | - 01_guest_role_hub<br>- 02_guest_value_landing<br>- 03_guest_action_choice<br>- 04_guest_save_later_prompt<br>- 05_guest_signed_in_comparison | - `page.tsx`에 소개 페이지가 존재하나, 테스트용 'Role Hub'(`01`)는 Next.js 앱에 없음.<br>- 모임 완료 후 계정 저장 넛지(`04`)가 일부 UI에만 간단한 텍스트로 존재하며, 시안 형태의 모달/배너 컴포넌트로 규격화되어 있지 않음. |
| **로그인 사용자 페이지**<br>(06~10) | - 06_signed_in_home<br>- 07_signed_in_calendar_settings<br>- 08_signed_in_default_settings<br>- 09_signed_in_recent_meetings<br>- 10_signed_in_profile | - **현재 Next.js 앱 내 대시보드/워크스페이스 관련 라우트가 전무함** (가장 큰 기능 공백).<br>- 로그인 완료 시 갈 수 있는 마이페이지, 설정(연동 캘린더 관리, 프로필 수정 등)이 구현되어야 함. |
| **호스트 모임 생성**<br>(11~15) | - 11_host_create_meeting<br>- 12_host_calendar_setup<br>- 13_host_candidate_times<br>- 14_host_share_link<br>- 15_host_status_board | - `schedule/create`에서 요일 선택과 시작/종료 드롭다운만 제공됨. 시안 `13`과 같이 비주얼 그리드에서 후보 시간을 칠하는 기능이 없음.<br>- 호스트 전용 결과 화면(`15`)이 `ScheduleRoomClient.tsx`와 혼재되어 있어, 호스트 대시보드 성격의 레이아웃 분리 및 모바일 카드 형태의 응답 리스트가 보완되어야 함. |
| **참여자 가용시간 입력**<br>(16~20) | - 16_participant_invite_entry<br>- 17_participant_calendar_detected<br>- 18_participant_upload_recovery<br>- 19_participant_time_grid<br>- 20_participant_done_result | - `/schedule/[id]` 참여자 뷰에서 이미지 파일 업로드 분석 에러 및 대기 모달 UI(`18`)가 미흡함.<br>- 모바일 환경의 터치 스크롤 중 시간 드래그 입력이 튀는 현상 해결 및 모바일 최적화 반응형 튜닝 필요. |

---

## 2. 구체적인 수정 및 구현 계획 (Proposed Changes)

### Phase 1: 개발자/테스터 편의를 위한 개발용 허브 개설
- **[NEW]** `/dev-hub/page.tsx`
  - 시안 `01` (Role Hub)을 Next.js 라우트로 포팅하여 테스터가 게스트, 로그인 유저, 주최자, 참여자 뷰의 상태를 바로 테스트할 수 있는 제어판 구현.

### Phase 2: 회원 대시보드 & 마이페이지 신설
- **[NEW]** `/dashboard/layout.tsx` (네비게이션바 및 사이드바 공통 레이아웃)
- **[NEW]** `/dashboard/page.tsx` (시안 `06` 대시보드 홈 - 연동 현황, 빠른 모임 생성 CTA)
- **[NEW]** `/dashboard/meetings/page.tsx` (시안 `09` 최근/과거 진행 모임 리스트)
- **[NEW]** `/dashboard/settings/page.tsx` (시안 `07`, `08`, `10` 통합 설정 - 프로필 정보, 연동 캘린더 관리, 기본 가용 조건 설정)

### Phase 3: 호스트 생성 단계 시각화 개선
- **[MODIFY]** [CreateScheduleClient.tsx](file:///c:/Users/kksu1/Dev/MOIM/src/app/schedule/create/CreateScheduleClient.tsx)
  - 요일/시간 설정 단계를 시안 `13`과 같은 격자형 시간 선택 컴포넌트로 개편하여 직관적으로 가능 요일/시간대를 칠할 수 있도록 개선.
  - 링크 완료 화면에 모임 저장 넛지(`04`) 디자인 컴포넌트 추가 적용.

### Phase 4: 참여자/호스트 결과 화면 고도화 및 모바일 튜닝
- **[MODIFY]** [ScheduleRoomClient.tsx](file:///c:/Users/kksu1/Dev/MOIM/src/app/schedule/[id]/ScheduleRoomClient.tsx)
  - 모바일 터치 이벤트 기반 시간 선택 최적화 (스크롤 감지 간섭 최소화).
  - 참여자 입력 전 캘린더 감지 화면(`17`) 및 시간표 이미지/ICS 업로드 분석 프로세스 화면(`18`)의 로딩 애니메이션 및 에러 가이드라인 강화.
  - 최종 제출 완료 화면(`20`) 구성 및 대시보드 전환 CTA 연동.

---

## 3. 검증 계획 (Verification Plan)

### 수동 검증 및 시각 디자인 체크
- 모바일 가상 기기(Chrome DevTools Device Mode - iPhone 12 Pro / SE 등)로 각 화면을 기동하여 시안 `docs/MOIM_role_screen/`의 모바일 가시성 비율과 일치하는지 비교.
- 카카오톡 인앱 브라우저 환경에서 발생할 수 있는 시간표 드래그 동작이 스크롤 이벤트와 충돌하지 않는지 확인.

### 자동화 테스트 추가
- Playwright E2E 테스트(`e2e/`)에 회원 가입 후 `/dashboard` 접근성 및 시간 설정 변경 저장 시나리오 추가 구현.
