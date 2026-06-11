-- ============================================================
-- Profiles 테이블 및 사용자 트리거 초기 설정
-- ============================================================

-- 공용 updated_at 트리거 함수 정의
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Profiles 테이블 정의
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  nickname text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is '사용자 프로필 정보 (Supabase Auth와 자동 연동)';

-- RLS 활성화
alter table public.profiles enable row level security;

-- RLS 정책 설정
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 회원가입 시 public.profiles에 자동으로 프로필을 연동해 주는 트리거 함수 정의
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, nickname, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- 트리거 설정
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- profiles updated_at 트리거 등록
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();
