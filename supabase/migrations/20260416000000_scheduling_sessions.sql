-- ============================================================
-- 스케줄링 세션 및 참여자 가용 시간 테이블
-- ============================================================

-- schedule_sessions 테이블 정의
create table public.schedule_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  host_id uuid not null references public.profiles(id) on delete cascade,
  duration_minutes integer not null,
  candidate_days text[] not null,
  candidate_start_hour integer not null,
  candidate_end_hour integer not null,
  status text not null default 'open',
  confirmed_slot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.schedule_sessions is '일정 잡기 세션 정보';

-- RLS 활성화
alter table public.schedule_sessions enable row level security;

-- schedule_sessions RLS 정책
create policy "Anyone can select schedule sessions"
  on public.schedule_sessions for select
  using (true);

create policy "Authenticated users can create schedule sessions"
  on public.schedule_sessions for insert
  to authenticated
  with check (host_id = auth.uid());

create policy "Hosts can update their own schedule sessions"
  on public.schedule_sessions for update
  to authenticated
  using (host_id = auth.uid())
  with check (host_id = auth.uid());

create policy "Hosts can delete their own schedule sessions"
  on public.schedule_sessions for delete
  to authenticated
  using (host_id = auth.uid());

-- participant_availabilities 테이블 정의
create table public.participant_availabilities (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.schedule_sessions(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  nickname text not null,
  available_slots jsonb not null, -- TimeSlot[] 형태의 json 배열
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 한 사용자가 한 세션에 가용시간을 하나만 등록할 수 있도록 유니크 제약
  unique (session_id, user_id)
);

comment on table public.participant_availabilities is '참여자별 가용 시간 정보';

-- RLS 활성화
alter table public.participant_availabilities enable row level security;

-- participant_availabilities RLS 정책
create policy "Anyone can select participant availabilities"
  on public.participant_availabilities for select
  using (true);

create policy "Authenticated users can insert their own availability"
  on public.participant_availabilities for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own availability"
  on public.participant_availabilities for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their own availability"
  on public.participant_availabilities for delete
  to authenticated
  using (user_id = auth.uid());

-- updated_at 트리거 등록
create trigger schedule_sessions_updated_at
  before update on public.schedule_sessions
  for each row execute function public.update_updated_at();

create trigger participant_availabilities_updated_at
  before update on public.participant_availabilities
  for each row execute function public.update_updated_at();
