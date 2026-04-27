// ============================================================
// Google Calendar 연동 도메인 타입
// ============================================================

/** Google OAuth 토큰 */
export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp (ms)
}

/** Google Calendar 목록 항목 */
export interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  backgroundColor?: string;
  primary?: boolean;
  accessRole: string;
}

/** Google Calendar 이벤트 */
export interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string; // ISO 8601
    date?: string; // YYYY-MM-DD (종일 이벤트)
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status: string;
  htmlLink?: string;
}

/** 일정 생성 입력 */
export interface GoogleEventInput {
  summary: string;
  description?: string;
  location?: string;
  startDateTime: string; // ISO 8601
  endDateTime: string; // ISO 8601
  timeZone?: string;
}

/** Google Calendar API 에러 응답 */
export interface GoogleApiError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

/** DB의 google_connections 행 */
export interface GoogleConnectionRow {
  id: string;
  profile_id: string;
  google_email: string;
  encrypted_refresh_token: string;
  encryption_iv: string;
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}
