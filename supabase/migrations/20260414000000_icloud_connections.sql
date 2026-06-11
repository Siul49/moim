-- ============================================================
-- iCloud CalDAV 연동 테이블
-- ============================================================

-- iCloud 연결 정보 (Apple ID + 암호화된 앱 전용 암호 + CalDAV 엔드포인트)
create table icloud_connections (
  id                  uuid        primary key default gen_random_uuid(),
  profile_id          uuid        not null references profiles(id) on delete cascade,
  apple_id            text        not null,
  -- AES-GCM 암호화: "base64(ciphertext):base64(authTag)" 형태로 저장
  encrypted_password  text        not null,
  encryption_iv       text        not null,  -- base64(12-byte IV)
  principal_url       text,                  -- CalDAV discovery 결과
  calendar_home_url   text,                  -- calendar-home-set URL
  is_active           boolean     not null default true,
  last_verified_at    timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (profile_id, apple_id)
);

comment on table icloud_connections is 'iCloud CalDAV 연동 정보. 앱 전용 암호는 AES-GCM으로 암호화 저장';
comment on column icloud_connections.encrypted_password is 'AES-256-GCM ciphertext:authTag (base64 인코딩)';
comment on column icloud_connections.encryption_iv is 'AES-GCM IV (base64, 12 bytes)';

create index idx_icloud_connections_profile on icloud_connections(profile_id);

-- 캘린더 컬렉션 목록 (discovery로 조회한 캘린더)
create table icloud_calendars (
  id            uuid        primary key default gen_random_uuid(),
  connection_id uuid        not null references icloud_connections(id) on delete cascade,
  display_name  text        not null,
  calendar_url  text        not null,  -- CalDAV collection URL
  color         text,
  ctag          text,                  -- 변경 감지용 캐시 태그
  synced_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (connection_id, calendar_url)
);

comment on table icloud_calendars is '연동된 iCloud 캘린더 컬렉션 목록';

create index idx_icloud_calendars_connection on icloud_calendars(connection_id);

-- updated_at 트리거
create trigger icloud_connections_updated_at
  before update on icloud_connections
  for each row execute function update_updated_at();

create trigger icloud_calendars_updated_at
  before update on icloud_calendars
  for each row execute function update_updated_at();

-- ============================================================
-- RLS 정책
-- ============================================================

alter table icloud_connections enable row level security;
alter table icloud_calendars enable row level security;

-- icloud_connections: 자기 연결만 접근
create policy "icloud_connections_select_own"
  on icloud_connections for select
  to authenticated
  using (profile_id = auth.uid());

create policy "icloud_connections_insert_own"
  on icloud_connections for insert
  to authenticated
  with check (profile_id = auth.uid());

create policy "icloud_connections_update_own"
  on icloud_connections for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "icloud_connections_delete_own"
  on icloud_connections for delete
  to authenticated
  using (profile_id = auth.uid());

-- icloud_calendars: 자기 연결에 속한 캘린더만 접근
create policy "icloud_calendars_select_own"
  on icloud_calendars for select
  to authenticated
  using (
    connection_id in (
      select id from icloud_connections where profile_id = auth.uid()
    )
  );

create policy "icloud_calendars_insert_own"
  on icloud_calendars for insert
  to authenticated
  with check (
    connection_id in (
      select id from icloud_connections where profile_id = auth.uid()
    )
  );

create policy "icloud_calendars_update_own"
  on icloud_calendars for update
  to authenticated
  using (
    connection_id in (
      select id from icloud_connections where profile_id = auth.uid()
    )
  );

create policy "icloud_calendars_delete_own"
  on icloud_calendars for delete
  to authenticated
  using (
    connection_id in (
      select id from icloud_connections where profile_id = auth.uid()
    )
  );
