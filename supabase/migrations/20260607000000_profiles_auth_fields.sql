-- ============================================================
-- profiles 확장: 이메일/비밀번호 회원가입 부가 정보 컬럼 추가
-- (자체 JWT+Prisma 인증 → Supabase Auth 통합, #45)
-- ============================================================
--
-- 기존 자체 회원가입(Prisma User)이 수집하던 부가 필드를
-- public.profiles 로 옮긴다. 가입 시 supabase.auth.signUp 의
-- options.data(user_metadata)로 전달된 값을 handle_new_user
-- 트리거가 그대로 채운다.

-- 1) 컬럼 추가
alter table public.profiles
  add column if not exists phone_number      text,
  add column if not exists is_age_over_14    boolean,
  add column if not exists terms_agreed_at   timestamptz,
  add column if not exists privacy_agreed_at timestamptz,
  add column if not exists marketing_agreed  boolean not null default false,
  add column if not exists event_sms_agreed  boolean not null default false;

-- 전화번호는 가입자별 고유 (Prisma의 @unique 대응)
create unique index if not exists profiles_phone_number_key
  on public.profiles (phone_number)
  where phone_number is not null;

-- 닉네임도 고유 보장 (Prisma의 nickname @unique 대응)
create unique index if not exists profiles_nickname_key
  on public.profiles (nickname)
  where nickname is not null;

-- 2) 신규 가입 트리거를 확장 필드까지 채우도록 교체
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
    event_sms_agreed
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
    coalesce((new.raw_user_meta_data->>'event_sms_agreed')::boolean, false)
  );
  return new;
end;
$$ language plpgsql security definer;
