/**
 * Provider-agnostic 캘린더 이벤트 타입
 *
 * iCloud(`ParsedEvent`), Google(`GoogleEvent`), 수동 입력, AI 사진 추출 등
 * 모든 입력 경로의 출력이 이 타입으로 통일된다. 가용시간 산출 로직(`free-slots`,
 * `availability`)은 provider 구분 없이 이 타입만 다룬다.
 */

/** 이벤트 출처 — 추후 디버깅·UI 라벨링·신뢰도 가중치에 사용 */
export type CalendarEventSource =
  | "icloud"
  | "google"
  | "manual"
  | "photo"
  | "ics";

/**
 * 표준 캘린더 이벤트
 *
 * `startAt`/`endAt`은 항상 절대 시각(`Date`). 시간대는 변환 시점에 해석되며
 * 여기서는 보존하지 않는다(필요 시 `metadata`에 둔다).
 */
export interface CalendarEvent {
  /** provider별 고유 ID와 별개로, 시스템 내부에서 유일하게 식별하는 키 */
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  isAllDay: boolean;
  source: CalendarEventSource;
  location?: string;
  description?: string;
  /** 원본 provider ID (디버깅·중복 제거용) */
  externalId?: string;
}

/** 절대 시각 기반 시간 범위 — busy 또는 free 슬롯 모두 표현 */
export interface TimeRange {
  startAt: Date;
  endAt: Date;
}

/** 가용시간 계산 대상이 되는 검색 윈도우 (예: 호스트가 지정한 후보 기간) */
export interface SearchWindow {
  startAt: Date;
  endAt: Date;
}
