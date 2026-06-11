-- ============================================================
-- profiles.naver_id 추가 — 네이버 로그인 안정적 식별자 (#46, #58)
-- ============================================================
--
-- 네이버는 Supabase 기본 미지원이라 Admin 브리지로 로그인한다.
-- 네이버 이메일은 미제공이거나 변경될 수 있어 이메일로 사용자를 식별하면
-- 동일 계정이 갈라질 수 있다. 변하지 않는 네이버 회원번호(naver_id)를
-- profiles에 저장해 1차 식별자로 사용한다.

-- 1) 컬럼 추가
alter table public.profiles
  add column if not exists naver_id text;

-- 네이버 회원번호는 전역 고유 (이미 채워진 행끼리만 유일성 보장)
-- 빈 문자열/공백은 '식별자 없음'으로 보고 인덱스에서 제외한다.
create unique index if not exists profiles_naver_id_key
  on public.profiles (naver_id)
  where nullif(btrim(naver_id), '') is not null;

-- 2) 신규 가입 트리거가 user_metadata.naver_id 까지 채우도록 교체
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    email,
    nickname,
    avatar_url,
    phone_number,
    is_age_over_14,
    terms_agreed_at,
    privacy_agreed_at,
    marketing_agreed,
    event_sms_agreed,
    naver_id
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'nickname',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.email
    ),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'phone_number',
    (new.raw_user_meta_data->>'is_age_over_14')::boolean,
    (new.raw_user_meta_data->>'terms_agreed_at')::timestamptz,
    (new.raw_user_meta_data->>'privacy_agreed_at')::timestamptz,
    coalesce((new.raw_user_meta_data->>'marketing_agreed')::boolean, false),
    coalesce((new.raw_user_meta_data->>'event_sms_agreed')::boolean, false),
    nullif(btrim(new.raw_user_meta_data->>'naver_id'), '')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;
