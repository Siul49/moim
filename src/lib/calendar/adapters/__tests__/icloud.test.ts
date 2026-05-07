import { describe, test, expect } from "vitest";
import { icloudAdapter } from "../icloud";
import type { ParsedEvent } from "@/types/icloud";

const iso = (s: string) => new Date(s);

describe("icloudAdapter — ParsedEvent → CalendarEvent", () => {
  test("필수 필드를 그대로 매핑한다", () => {
    const parsed: ParsedEvent[] = [
      {
        uid: "evt-1",
        title: "팀 미팅",
        startAt: iso("2026-05-10T10:00:00Z"),
        endAt: iso("2026-05-10T11:00:00Z"),
        isAllDay: false,
        location: "Zoom",
        description: "주간 회의",
      },
    ];

    const result = icloudAdapter.toCalendarEvents(parsed);

    expect(result).toEqual([
      {
        id: "icloud:evt-1",
        externalId: "evt-1",
        title: "팀 미팅",
        startAt: iso("2026-05-10T10:00:00Z"),
        endAt: iso("2026-05-10T11:00:00Z"),
        isAllDay: false,
        source: "icloud",
        location: "Zoom",
        description: "주간 회의",
      },
    ]);
  });

  test("title이 비면 '(제목 없음)' 으로 대체한다", () => {
    const parsed: ParsedEvent[] = [
      {
        uid: "evt-2",
        title: "",
        startAt: iso("2026-05-10T10:00:00Z"),
        endAt: iso("2026-05-10T11:00:00Z"),
        isAllDay: false,
      },
    ];

    expect(icloudAdapter.toCalendarEvents(parsed)[0].title).toBe(
      "(제목 없음)",
    );
  });

  test("source는 항상 'icloud'", () => {
    expect(icloudAdapter.source).toBe("icloud");
  });
});
