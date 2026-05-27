/**
 * 캘린더 provider 어댑터 인터페이스
 *
 * 각 provider(iCloud, Google, 수동 입력, AI 사진 추출, .ics 등)는 raw 데이터
 * 형태가 모두 다르다. 이 인터페이스를 구현하면 표준 `CalendarEvent[]`로 변환되어
 * 이후의 free/busy 계산·교집합 로직이 provider 구분 없이 동일하게 동작한다.
 *
 * 새로운 provider를 추가할 때:
 * 1. `adapters/<provider>.ts`에 `createXxxAdapter()` 팩토리를 만들고
 * 2. `toCalendarEvents`에서 provider raw → CalendarEvent 매핑을 작성한 뒤
 * 3. 본 모듈의 `ADAPTER_REGISTRY`에 등록한다.
 */

import type {
  CalendarEvent,
  CalendarEventSource,
} from "@/types/calendar-event";

export interface CalendarAdapter<TRaw> {
  readonly source: CalendarEventSource;
  toCalendarEvents(raw: TRaw): CalendarEvent[];
}
