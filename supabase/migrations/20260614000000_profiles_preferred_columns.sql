-- ============================================================
-- profiles 확장: 기본 일정 선호 조건 컬럼 추가 (#65)
-- ============================================================
--
-- 연동 및 설정 페이지(src/app/dashboard/settings/page.tsx)가 저장하는
-- 선호 시작/종료 시간 및 기본 타임존을 담을 컬럼이 누락되어 있어
-- 저장 시 PGRST204(column not found) 에러가 발생했다.
--
-- 값은 화면 select의 문자열("09", "18", "Asia/Seoul")을 그대로 보관하므로
-- text 타입으로 정의한다.

alter table public.profiles
  add column if not exists preferred_start_hour text not null default '09',
  add column if not exists preferred_end_hour   text not null default '18',
  add column if not exists preferred_timezone   text not null default 'Asia/Seoul';
