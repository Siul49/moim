/**
 * iCloud(CalDAV) → 표준 CalendarEvent 어댑터
 *
 * 입력은 `@/lib/caldav/query`가 반환하는 `ParsedEvent[]` (이미 ICS 파싱이 끝난
 * 도메인 객체). title 누락 등 방어 케이스만 처리하며 시간/날짜 변환은 없다.
 */

import type { ParsedEvent } from "@/types/icloud";
import type { CalendarEvent } from "@/types/calendar-event";
import type { CalendarAdapter } from "../adapter";

export const icloudAdapter: CalendarAdapter<ParsedEvent[]> = {
  source: "icloud",
  toCalendarEvents(events) {
    return events.map(toCalendarEvent);
  },
};

function toCalendarEvent(event: ParsedEvent): CalendarEvent {
  return {
    id: `icloud:${event.uid}`,
    externalId: event.uid,
    title: event.title || "(제목 없음)",
    startAt: event.startAt,
    endAt: event.endAt,
    isAllDay: event.isAllDay,
    source: "icloud",
    location: event.location,
    description: event.description,
  };
}
