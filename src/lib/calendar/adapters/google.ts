/**
 * Google Calendar → 표준 CalendarEvent 어댑터
 *
 * Google API의 `events.list` 응답 항목(`GoogleEvent`)을 표준 형식으로 변환한다.
 *
 * Google 이벤트의 시작/종료는 두 가지 형태:
 *  - `dateTime` (ISO 8601, 시간대 포함) — 일반 이벤트
 *  - `date`     (`YYYY-MM-DD`) — 종일 이벤트(시간대는 RFC 5545에 따라 floating).
 *
 * 종일 이벤트는 사용자 로컬 자정~다음 날 자정으로 해석한다. 시간대 정밀도가
 * 필요한 케이스(예: 정확한 회의 가능 여부)는 호출자가 별도 처리한다.
 */

import type { GoogleEvent } from "@/types/google-calendar";
import type { CalendarEvent } from "@/types/calendar-event";
import type { CalendarAdapter } from "../adapter";

export const googleAdapter: CalendarAdapter<GoogleEvent[]> = {
  source: "google",
  toCalendarEvents(events) {
    return events
      .filter((event) => event.status !== "cancelled")
      .map(toCalendarEvent);
  },
};

function toCalendarEvent(event: GoogleEvent): CalendarEvent {
  const isAllDay = Boolean(event.start.date && event.end.date);

  const startAt = isAllDay
    ? parseAllDay(event.start.date as string)
    : new Date(event.start.dateTime as string);

  const endAt = isAllDay
    ? parseAllDay(event.end.date as string)
    : new Date(event.end.dateTime as string);

  return {
    id: `google:${event.id}`,
    externalId: event.id,
    title: event.summary || "(제목 없음)",
    startAt,
    endAt,
    isAllDay,
    source: "google",
    location: event.location,
    description: event.description,
  };
}

function parseAllDay(yyyymmdd: string): Date {
  const [y, m, d] = yyyymmdd.split("-").map(Number);
  return new Date(y, m - 1, d);
}
