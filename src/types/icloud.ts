// ============================================================
// iCloud CalDAV 도메인 공통 타입
// ============================================================

/** CalDAV 인증 자격증명 */
export interface CalDAVAuth {
  username: string;
  password: string;
}

/** CalDAV discovery 결과 */
export interface DiscoveryResult {
  principalUrl: string;
  calendarHomeUrl: string;
  calendars: CalendarInfo[];
}

/** 캘린더 컬렉션 정보 */
export interface CalendarInfo {
  url: string;
  displayName: string;
  color?: string;
  ctag?: string;
}

/** CalDAV 서버에서 받아온 raw 이벤트 데이터 */
export interface RawEventData {
  href: string;
  etag: string;
  icsData: string;
}

/** ICS에서 파싱된 이벤트 */
export interface ParsedEvent {
  uid: string;
  title: string;
  startAt: Date;
  endAt: Date;
  location?: string;
  description?: string;
  isAllDay: boolean;
}

/** 일정 생성 입력 */
export interface EventInput {
  title: string;
  startAt: Date;
  endAt: Date;
  location?: string;
  description?: string;
  uid?: string;
}

/** ICS 빌드 결과 */
export interface BuiltEvent {
  uid: string;
  icsContent: string;
}

/** PUT 일정 생성 결과 */
export interface CreateEventResult {
  href: string;
  etag: string;
}

/** DB의 icloud_connections 행 */
export interface ICloudConnectionRow {
  id: string;
  profile_id: string;
  apple_id: string;
  encrypted_password: string;
  encryption_iv: string;
  principal_url: string | null;
  calendar_home_url: string | null;
  is_active: boolean;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

/** DB의 icloud_calendars 행 */
export interface ICloudCalendarRow {
  id: string;
  connection_id: string;
  display_name: string;
  calendar_url: string;
  color: string | null;
  ctag: string | null;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
}
