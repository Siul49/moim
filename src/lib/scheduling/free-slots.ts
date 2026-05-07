/**
 * busy 이벤트 ↔ free 슬롯 변환
 *
 * 외부 캘린더에서 가져온 일정은 일반적으로 "사용자가 점유 중(busy)"이라는
 * 의미다. 모임 가능 시간을 찾으려면 검색 윈도우에서 busy 구간을 빼야 하며,
 * 본 모듈은 그 변환을 담당한다.
 *
 * 출력은 항상 시간 오름차순으로 정렬되어 있고, 인접한 free 구간은 병합되지
 * 않는다(busy 이벤트 사이의 경계가 그대로 노출되어야 후속 단계에서 회의
 * 길이 필터를 적용할 수 있다).
 */

import type {
  CalendarEvent,
  SearchWindow,
  TimeRange,
} from "@/types/calendar-event";
import { mergeOverlappingDateSlots } from "./time-slot";

export function eventsToBusyRanges(
  events: CalendarEvent[],
  window: SearchWindow,
): TimeRange[] {
  const windowStart = window.startAt.getTime();
  const windowEnd = window.endAt.getTime();

  const clipped: TimeRange[] = [];
  for (const event of events) {
    const start = Math.max(event.startAt.getTime(), windowStart);
    const end = Math.min(event.endAt.getTime(), windowEnd);
    if (start < end) {
      clipped.push({ startAt: new Date(start), endAt: new Date(end) });
    }
  }

  return mergeOverlappingDateSlots(clipped);
}

export function busyEventsToFree(
  events: CalendarEvent[],
  window: SearchWindow,
): TimeRange[] {
  const busy = eventsToBusyRanges(events, window);
  if (busy.length === 0) {
    return [{ startAt: window.startAt, endAt: window.endAt }];
  }

  const free: TimeRange[] = [];
  let cursor = window.startAt.getTime();
  const windowEnd = window.endAt.getTime();

  for (const range of busy) {
    const rangeStart = range.startAt.getTime();
    if (cursor < rangeStart) {
      free.push({
        startAt: new Date(cursor),
        endAt: new Date(rangeStart),
      });
    }
    cursor = Math.max(cursor, range.endAt.getTime());
  }

  if (cursor < windowEnd) {
    free.push({
      startAt: new Date(cursor),
      endAt: new Date(windowEnd),
    });
  }

  return free;
}
