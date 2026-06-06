// ============================================================
// Naver Calendar 연동 도메인 타입
// ============================================================

/** Naver OAuth 토큰 */
export interface NaverTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: number; // Unix timestamp (ms)
}

/** 네이버 회원 프로필 */
export interface NaverUserProfile {
  id: string;
  email?: string;
  nickname?: string;
  name?: string;
}

/** 일정 생성 입력 */
export interface NaverEventInput {
  summary: string;
  startDateTime: string; // ISO 8601
  endDateTime: string; // ISO 8601
  calendarId?: string; // 기본값: defaultCalendarId
  location?: string;
  description?: string;
  timeZone?: string;
  uid?: string;
}

/** 네이버 캘린더 일정 생성 결과 */
export interface NaverEvent {
  calendarId: string;
  processType: string;
  icalUid: string;
}

/** 네이버 캘린더 일정 생성 API 응답 */
export interface NaverCreateScheduleResponse {
  result: "success" | "failure";
  code: number;
  message?: string;
  returnValue?: NaverEvent;
}

