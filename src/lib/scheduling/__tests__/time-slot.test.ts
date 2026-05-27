import { describe, test, expect } from "vitest";
import {
  sortSlots,
  mergeOverlapping,
  sortDateSlots,
  mergeOverlappingDateSlots,
} from "../time-slot";
import type { TimeSlot, DateTimeSlot } from "@/types/schedule";

const iso = (s: string) => new Date(s);

describe("sortSlots — 요일·시작시간 순 정렬", () => {
  test("요일 우선, 같은 요일은 시작 시간 오름차순으로 정렬한다", () => {
    const input: TimeSlot[] = [
      { day: "WED", startHour: 9, endHour: 11 },
      { day: "MON", startHour: 14, endHour: 16 },
      { day: "MON", startHour: 9, endHour: 12 },
    ];

    expect(sortSlots(input)).toEqual([
      { day: "MON", startHour: 9, endHour: 12 },
      { day: "MON", startHour: 14, endHour: 16 },
      { day: "WED", startHour: 9, endHour: 11 },
    ]);
  });

  test("입력 배열을 변형하지 않는다", () => {
    const input: TimeSlot[] = [
      { day: "TUE", startHour: 10, endHour: 12 },
      { day: "MON", startHour: 9, endHour: 10 },
    ];
    const snapshot = JSON.parse(JSON.stringify(input));

    sortSlots(input);

    expect(input).toEqual(snapshot);
  });
});

describe("mergeOverlapping — 겹치거나 인접한 슬롯 병합", () => {
  test("같은 요일에서 겹치는 슬롯은 하나로 합친다", () => {
    const input: TimeSlot[] = [
      { day: "MON", startHour: 9, endHour: 12 },
      { day: "MON", startHour: 11, endHour: 14 },
    ];

    expect(mergeOverlapping(input)).toEqual([
      { day: "MON", startHour: 9, endHour: 14 },
    ]);
  });

  test("같은 요일에서 인접한(end===start) 슬롯도 병합한다", () => {
    const input: TimeSlot[] = [
      { day: "MON", startHour: 9, endHour: 11 },
      { day: "MON", startHour: 11, endHour: 13 },
    ];

    expect(mergeOverlapping(input)).toEqual([
      { day: "MON", startHour: 9, endHour: 13 },
    ]);
  });

  test("서로 다른 요일은 병합하지 않는다", () => {
    const input: TimeSlot[] = [
      { day: "MON", startHour: 9, endHour: 12 },
      { day: "TUE", startHour: 9, endHour: 12 },
    ];

    expect(mergeOverlapping(input)).toEqual([
      { day: "MON", startHour: 9, endHour: 12 },
      { day: "TUE", startHour: 9, endHour: 12 },
    ]);
  });

  test("빈 배열은 빈 배열을 반환한다", () => {
    expect(mergeOverlapping([])).toEqual([]);
  });
});

describe("sortDateSlots — Date 기반 정렬", () => {
  test("startAt 오름차순으로 정렬한다", () => {
    const input: DateTimeSlot[] = [
      { startAt: iso("2026-05-10T14:00:00Z"), endAt: iso("2026-05-10T15:00:00Z") },
      { startAt: iso("2026-05-09T10:00:00Z"), endAt: iso("2026-05-09T11:00:00Z") },
    ];

    const result = sortDateSlots(input);

    expect(result[0].startAt.toISOString()).toBe("2026-05-09T10:00:00.000Z");
    expect(result[1].startAt.toISOString()).toBe("2026-05-10T14:00:00.000Z");
  });
});

describe("mergeOverlappingDateSlots — Date 기반 병합", () => {
  test("겹치는 시간 범위를 하나로 합친다", () => {
    const input: DateTimeSlot[] = [
      { startAt: iso("2026-05-10T09:00:00Z"), endAt: iso("2026-05-10T11:00:00Z") },
      { startAt: iso("2026-05-10T10:30:00Z"), endAt: iso("2026-05-10T12:00:00Z") },
    ];

    const result = mergeOverlappingDateSlots(input);

    expect(result).toHaveLength(1);
    expect(result[0].startAt.toISOString()).toBe("2026-05-10T09:00:00.000Z");
    expect(result[0].endAt.toISOString()).toBe("2026-05-10T12:00:00.000Z");
  });

  test("인접(end===start)한 슬롯도 병합한다", () => {
    const input: DateTimeSlot[] = [
      { startAt: iso("2026-05-10T09:00:00Z"), endAt: iso("2026-05-10T10:00:00Z") },
      { startAt: iso("2026-05-10T10:00:00Z"), endAt: iso("2026-05-10T11:00:00Z") },
    ];

    const result = mergeOverlappingDateSlots(input);

    expect(result).toHaveLength(1);
    expect(result[0].endAt.toISOString()).toBe("2026-05-10T11:00:00.000Z");
  });

  test("겹치지 않으면 그대로 둔다", () => {
    const input: DateTimeSlot[] = [
      { startAt: iso("2026-05-10T09:00:00Z"), endAt: iso("2026-05-10T10:00:00Z") },
      { startAt: iso("2026-05-10T11:00:00Z"), endAt: iso("2026-05-10T12:00:00Z") },
    ];

    expect(mergeOverlappingDateSlots(input)).toHaveLength(2);
  });
});
