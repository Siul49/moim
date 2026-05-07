-- ============================================================
-- Google Calendar 연동 테이블
-- ============================================================

-- Google OAuth 연결 정보 (refresh_token 암호화 저장)
CREATE TABLE IF NOT EXISTS google_connections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  google_email  TEXT NOT NULL,

  -- refresh_token 암호화 저장 (AES-256-GCM)
  encrypted_refresh_token TEXT NOT NULL,
  encryption_iv           TEXT NOT NULL,

  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 같은 사용자가 같은 Google 계정을 중복 연결하지 않도록
  UNIQUE (profile_id, google_email)
);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_google_connections_updated_at
  BEFORE UPDATE ON google_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS (Row Level Security) 정책
-- ============================================================

ALTER TABLE google_connections ENABLE ROW LEVEL SECURITY;

-- 자신의 연결만 조회 가능
CREATE POLICY google_connections_select_own
  ON google_connections FOR SELECT
  USING (profile_id = auth.uid());

-- 자신의 연결만 삽입 가능
CREATE POLICY google_connections_insert_own
  ON google_connections FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- 자신의 연결만 수정 가능
CREATE POLICY google_connections_update_own
  ON google_connections FOR UPDATE
  USING (profile_id = auth.uid());

-- 자신의 연결만 삭제 가능
CREATE POLICY google_connections_delete_own
  ON google_connections FOR DELETE
  USING (profile_id = auth.uid());

-- ============================================================
-- 인덱스
-- ============================================================

CREATE INDEX idx_google_connections_profile_id
  ON google_connections(profile_id);
