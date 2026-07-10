import { describe, it, expect } from "vitest";
import { eventsToBusySlotKeys } from "../calendar-busy";
import type { CalendarEvent } from "@/types/calendar-event";

function event(startAt: Date, endAt: Date, isAllDay = false): CalendarEvent {
  return {
    id: `e-${startAt.getTime()}`,
    title: "test",
    startAt,
    endAt,
    isAllDay,
    source: "google",
  };
}

// 테스트는 로컬 시간대 기준으로 동작한다(함수가 getDay/getHours를 사용).
// new Date(y, m, d, h)는 로컬 시간 생성자이므로 일관된 기준이 된다.

describe("eventsToBusySlotKeys", () => {
  const window = { startHour: 9, endHour: 18 };

  it("정시에 딱 맞는 1시간 이벤트는 해당 칸 하나만 busy로 만든다", () => {
    // 2026-06-15는 월요일(MON)
    const ev = event(
      new Date(2026, 5, 15, 10, 0),
      new Date(2026, 5, 15, 11, 0),
    );
    expect(eventsToBusySlotKeys([ev], window)).toEqual(["MON-10"]);
  });

  it("정시에 걸치는(부분 겹침) 이벤트는 걸친 칸을 모두 busy로 만든다", () => {
    // 10:30~11:30 → 10시, 11시 칸 점유
    const ev = event(
      new Date(2026, 5, 15, 10, 30),
      new Date(2026, 5, 15, 11, 30),
    );
    expect(eventsToBusySlotKeys([ev], window).sort()).toEqual([
      "MON-10",
      "MON-11",
    ]);
  });

  it("후보 시간(startHour~endHour) 밖의 칸은 무시한다", () => {
    // 08:00~09:30 → 8시는 윈도우 밖, 9시만 점유
    const ev = event(new Date(2026, 5, 15, 8, 0), new Date(2026, 5, 15, 9, 30));
    expect(eventsToBusySlotKeys([ev], window)).toEqual(["MON-9"]);
  });

  it("days 제한을 주면 해당 요일만 반영한다", () => {
    // 월/화 각각 10시 이벤트, days=[TUE]면 화요일만
    const mon = event(
      new Date(2026, 5, 15, 10, 0),
      new Date(2026, 5, 15, 11, 0),
    );
    const tue = event(
      new Date(2026, 5, 16, 10, 0),
      new Date(2026, 5, 16, 11, 0),
    );
    expect(
      eventsToBusySlotKeys([mon, tue], { ...window, days: ["TUE"] }),
    ).toEqual(["TUE-10"]);
  });

  it("종일 이벤트는 그날 후보 시간 전체를 busy로 만든다", () => {
    // 2026-06-15(월) 종일 → endAt은 다음날 0시(미포함)
    const ev = event(
      new Date(2026, 5, 15, 0, 0),
      new Date(2026, 5, 16, 0, 0),
      true,
    );
    const result = eventsToBusySlotKeys([ev], window).sort();
    expect(result).toEqual([
      "MON-10",
      "MON-11",
      "MON-12",
      "MON-13",
      "MON-14",
      "MON-15",
      "MON-16",
      "MON-17",
      "MON-9",
    ]);
  });

  it("중복되는 이벤트는 키를 중복 없이 합친다", () => {
    const a = event(new Date(2026, 5, 15, 10, 0), new Date(2026, 5, 15, 11, 0));
    const b = event(
      new Date(2026, 5, 15, 10, 30),
      new Date(2026, 5, 15, 11, 0),
    );
    expect(eventsToBusySlotKeys([a, b], window)).toEqual(["MON-10"]);
  });

  it("잘못된 날짜(Invalid Date) 이벤트는 건너뛴다", () => {
    const ev = event(new Date("invalid"), new Date("invalid"));
    expect(eventsToBusySlotKeys([ev], window)).toEqual([]);
  });
});
