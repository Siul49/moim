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

-- 시간값 무결성: "00"~"23" 형식 + 시작 < 종료 강제 (API 우회/직접 조작 방어)
-- ADD CONSTRAINT은 IF NOT EXISTS를 지원하지 않으므로 재실행 안전을 위해 drop 후 add
alter table public.profiles
  drop constraint if exists profiles_preferred_hours_check;

alter table public.profiles
  add constraint profiles_preferred_hours_check check (
    preferred_start_hour ~ '^(0[0-9]|1[0-9]|2[0-3])$' and
    preferred_end_hour   ~ '^(0[0-9]|1[0-9]|2[0-3])$' and
    preferred_start_hour::int < preferred_end_hour::int
  );
