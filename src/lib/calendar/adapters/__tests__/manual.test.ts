import { describe, test, expect } from "vitest";
import { manualSlotsToFreeEvents } from "../manual";
import type { TimeSlot } from "@/types/schedule";

describe("manualSlotsToFreeEvents — 그리드 선택 → free CalendarEvent", () => {
  test("주어진 weekStart 기준으로 요일 슬롯을 절대 시각으로 환산한다", () => {
    // 2026-05-04는 월요일
    const weekStart = new Date(2026, 4, 4, 0, 0, 0, 0);
    const slots: TimeSlot[] = [
      { day: "MON", startHour: 9, endHour: 11 },
      { day: "WED", startHour: 14, endHour: 16 },
    ];

    const result = manualSlotsToFreeEvents(slots, { weekStart });

    expect(result).toHaveLength(2);

    expect(result[0].source).toBe("manual");
    expect(result[0].isAllDay).toBe(false);
    expect(result[0].startAt.getDay()).toBe(1); // 월요일
    expect(result[0].startAt.getHours()).toBe(9);
    expect(result[0].endAt.getHours()).toBe(11);

    expect(result[1].startAt.getDay()).toBe(3); // 수요일
    expect(result[1].startAt.getHours()).toBe(14);
    expect(result[1].endAt.getHours()).toBe(16);
  });

  test("빈 입력은 빈 배열을 반환한다", () => {
    const weekStart = new Date(2026, 4, 4);
    expect(manualSlotsToFreeEvents([], { weekStart })).toEqual([]);
  });

  test("id는 슬롯 위치·요일·시간으로 유일하게 만들어진다", () => {
    const weekStart = new Date(2026, 4, 4);
    const slots: TimeSlot[] = [
      { day: "MON", startHour: 9, endHour: 10 },
      { day: "MON", startHour: 9, endHour: 10 },
    ];

    const result = manualSlotsToFreeEvents(slots, { weekStart });

    expect(result[0].id).not.toBe(result[1].id);
  });
});
