import { describe, test, expect } from "vitest";
import { busyEventsToFree, eventsToBusyRanges } from "../free-slots";
import type { CalendarEvent, SearchWindow } from "@/types/calendar-event";

const iso = (s: string) => new Date(s);

const evt = (
  startAt: string,
  endAt: string,
  overrides: Partial<CalendarEvent> = {},
): CalendarEvent => ({
  id: overrides.id ?? `${startAt}-${endAt}`,
  title: overrides.title ?? "busy",
  startAt: iso(startAt),
  endAt: iso(endAt),
  isAllDay: overrides.isAllDay ?? false,
  source: overrides.source ?? "icloud",
  ...overrides,
});

describe("eventsToBusyRanges — 이벤트를 busy 시간 범위로 정규화", () => {
  test("창(window) 밖 이벤트는 잘라낸다", () => {
    const window: SearchWindow = {
      startAt: iso("2026-05-10T09:00:00Z"),
      endAt: iso("2026-05-10T18:00:00Z"),
    };
    const events: CalendarEvent[] = [
      evt("2026-05-10T07:00:00Z", "2026-05-10T10:00:00Z"),
      evt("2026-05-10T17:00:00Z", "2026-05-10T20:00:00Z"),
      evt("2026-05-11T08:00:00Z", "2026-05-11T09:00:00Z"),
    ];

    const result = eventsToBusyRanges(events, window);

    expect(result).toEqual([
      { startAt: iso("2026-05-10T09:00:00Z"), endAt: iso("2026-05-10T10:00:00Z") },
      { startAt: iso("2026-05-10T17:00:00Z"), endAt: iso("2026-05-10T18:00:00Z") },
    ]);
  });

  test("겹치는 busy 이벤트는 병합한다", () => {
    const window: SearchWindow = {
      startAt: iso("2026-05-10T00:00:00Z"),
      endAt: iso("2026-05-10T23:59:59Z"),
    };
    const events: CalendarEvent[] = [
      evt("2026-05-10T09:00:00Z", "2026-05-10T11:00:00Z"),
      evt("2026-05-10T10:30:00Z", "2026-05-10T12:00:00Z"),
    ];

    const result = eventsToBusyRanges(events, window);

    expect(result).toEqual([
      { startAt: iso("2026-05-10T09:00:00Z"), endAt: iso("2026-05-10T12:00:00Z") },
    ]);
  });
});

describe("busyEventsToFree — busy → free 반전", () => {
  test("이벤트가 없으면 윈도우 전체가 free", () => {
    const window: SearchWindow = {
      startAt: iso("2026-05-10T09:00:00Z"),
      endAt: iso("2026-05-10T18:00:00Z"),
    };

    const result = busyEventsToFree([], window);

    expect(result).toEqual([
      { startAt: window.startAt, endAt: window.endAt },
    ]);
  });

  test("중간에 한 개의 busy 이벤트가 있으면 앞·뒤 두 개의 free 슬롯이 생긴다", () => {
    const window: SearchWindow = {
      startAt: iso("2026-05-10T09:00:00Z"),
      endAt: iso("2026-05-10T18:00:00Z"),
    };
    const events: CalendarEvent[] = [
      evt("2026-05-10T12:00:00Z", "2026-05-10T13:00:00Z"),
    ];

    const result = busyEventsToFree(events, window);

    expect(result).toEqual([
      { startAt: iso("2026-05-10T09:00:00Z"), endAt: iso("2026-05-10T12:00:00Z") },
      { startAt: iso("2026-05-10T13:00:00Z"), endAt: iso("2026-05-10T18:00:00Z") },
    ]);
  });

  test("이벤트가 윈도우 시작과 정확히 맞물리면 앞 슬롯은 생기지 않는다", () => {
    const window: SearchWindow = {
      startAt: iso("2026-05-10T09:00:00Z"),
      endAt: iso("2026-05-10T18:00:00Z"),
    };
    const events: CalendarEvent[] = [
      evt("2026-05-10T09:00:00Z", "2026-05-10T11:00:00Z"),
    ];

    const result = busyEventsToFree(events, window);

    expect(result).toEqual([
      { startAt: iso("2026-05-10T11:00:00Z"), endAt: iso("2026-05-10T18:00:00Z") },
    ]);
  });

  test("윈도우 전체를 덮는 busy면 free는 빈 배열", () => {
    const window: SearchWindow = {
      startAt: iso("2026-05-10T09:00:00Z"),
      endAt: iso("2026-05-10T18:00:00Z"),
    };
    const events: CalendarEvent[] = [
      evt("2026-05-10T08:00:00Z", "2026-05-10T19:00:00Z"),
    ];

    expect(busyEventsToFree(events, window)).toEqual([]);
  });

  test("연속된 busy 이벤트는 병합 후 반전된다", () => {
    const window: SearchWindow = {
      startAt: iso("2026-05-10T09:00:00Z"),
      endAt: iso("2026-05-10T18:00:00Z"),
    };
    const events: CalendarEvent[] = [
      evt("2026-05-10T10:00:00Z", "2026-05-10T11:30:00Z"),
      evt("2026-05-10T11:00:00Z", "2026-05-10T12:00:00Z"),
    ];

    const result = busyEventsToFree(events, window);

    expect(result).toEqual([
      { startAt: iso("2026-05-10T09:00:00Z"), endAt: iso("2026-05-10T10:00:00Z") },
      { startAt: iso("2026-05-10T12:00:00Z"), endAt: iso("2026-05-10T18:00:00Z") },
    ]);
  });
});
