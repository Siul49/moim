import { describe, test, expect } from "vitest";
import { googleAdapter } from "../google";
import type { GoogleEvent } from "@/types/google-calendar";

describe("googleAdapter — GoogleEvent → CalendarEvent", () => {
  test("dateTime 기반 이벤트를 변환한다", () => {
    const events: GoogleEvent[] = [
      {
        id: "g-1",
        summary: "스탠드업",
        start: { dateTime: "2026-05-10T10:00:00Z" },
        end: { dateTime: "2026-05-10T10:30:00Z" },
        status: "confirmed",
      },
    ];

    const result = googleAdapter.toCalendarEvents(events);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "google:g-1",
      externalId: "g-1",
      title: "스탠드업",
      isAllDay: false,
      source: "google",
    });
    expect(result[0].startAt.toISOString()).toBe("2026-05-10T10:00:00.000Z");
    expect(result[0].endAt.toISOString()).toBe("2026-05-10T10:30:00.000Z");
  });

  test("date 기반 종일 이벤트는 isAllDay=true로 변환된다", () => {
    const events: GoogleEvent[] = [
      {
        id: "g-allday",
        summary: "휴가",
        start: { date: "2026-05-12" },
        end: { date: "2026-05-13" },
        status: "confirmed",
      },
    ];

    const result = googleAdapter.toCalendarEvents(events);

    expect(result[0].isAllDay).toBe(true);
    expect(result[0].title).toBe("휴가");
  });

  test("status === 'cancelled' 이벤트는 제외한다", () => {
    const events: GoogleEvent[] = [
      {
        id: "live",
        summary: "live",
        start: { dateTime: "2026-05-10T10:00:00Z" },
        end: { dateTime: "2026-05-10T11:00:00Z" },
        status: "confirmed",
      },
      {
        id: "dead",
        summary: "dead",
        start: { dateTime: "2026-05-10T12:00:00Z" },
        end: { dateTime: "2026-05-10T13:00:00Z" },
        status: "cancelled",
      },
    ];

    const result = googleAdapter.toCalendarEvents(events);

    expect(result).toHaveLength(1);
    expect(result[0].externalId).toBe("live");
  });

  test("summary가 비면 '(제목 없음)' 으로 대체한다", () => {
    const events: GoogleEvent[] = [
      {
        id: "g-empty",
        summary: "",
        start: { dateTime: "2026-05-10T10:00:00Z" },
        end: { dateTime: "2026-05-10T11:00:00Z" },
        status: "confirmed",
      },
    ];

    expect(googleAdapter.toCalendarEvents(events)[0].title).toBe(
      "(제목 없음)",
    );
  });
});
