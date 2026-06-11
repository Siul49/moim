import { describe, expect, it } from "vitest";
import { timetableToFreeSlots } from "../converter";
import type { EverytimeTimetable } from "@/types/everytime";

describe("timetableToFreeSlots", () => {
  it("수업이 없으면 후보 시간 전체가 빈 시간으로 반환된다", () => {
    const timetable: EverytimeTimetable = { lectures: [] };
    const result = timetableToFreeSlots(timetable, {
      candidateDays: ["MON"],
      candidateStartHour: 9,
      candidateEndHour: 12,
    });
    expect(result).toEqual([{ day: "MON", startHour: 9, endHour: 12 }]);
  });

  it("수업 시간이 빈 시간에서 제외된다", () => {
    // MON 09:00-10:30 수업 → 9시(9:00-10:00), 10시(10:00-11:00) 블록 불가
    const timetable: EverytimeTimetable = {
      lectures: [
        {
          name: "수학",
          times: [{ day: 0, startMinute: 540, endMinute: 630 }],
        },
      ],
    };
    const result = timetableToFreeSlots(timetable, {
      candidateDays: ["MON"],
      candidateStartHour: 9,
      candidateEndHour: 13,
    });
    expect(result).toEqual([{ day: "MON", startHour: 11, endHour: 13 }]);
  });

  it("여러 수업 사이 시간이 각각 빈 시간으로 반환된다", () => {
    // MON 09:00-10:30, MON 13:00-14:30
    const timetable: EverytimeTimetable = {
      lectures: [
        {
          name: "수학",
          times: [{ day: 0, startMinute: 540, endMinute: 630 }],
        },
        {
          name: "영어",
          times: [{ day: 0, startMinute: 780, endMinute: 870 }],
        },
      ],
    };
    const result = timetableToFreeSlots(timetable, {
      candidateDays: ["MON"],
      candidateStartHour: 9,
      candidateEndHour: 18,
    });
    expect(result).toEqual([
      { day: "MON", startHour: 11, endHour: 13 },
      { day: "MON", startHour: 15, endHour: 18 },
    ]);
  });

  it("다른 요일 수업은 해당 요일 빈 시간에 영향을 주지 않는다", () => {
    const timetable: EverytimeTimetable = {
      lectures: [
        {
          name: "수학",
          times: [{ day: 1, startMinute: 540, endMinute: 630 }], // 화요일
        },
      ],
    };
    const result = timetableToFreeSlots(timetable, {
      candidateDays: ["MON"],
      candidateStartHour: 9,
      candidateEndHour: 12,
    });
    expect(result).toEqual([{ day: "MON", startHour: 9, endHour: 12 }]);
  });

  it("여러 요일에 걸친 시간표를 한 번에 처리한다", () => {
    const timetable: EverytimeTimetable = {
      lectures: [
        {
          name: "데이터구조",
          times: [
            { day: 1, startMinute: 540, endMinute: 630 }, // 화 09:00-10:30
            { day: 3, startMinute: 540, endMinute: 630 }, // 목 09:00-10:30
          ],
        },
      ],
    };
    const result = timetableToFreeSlots(timetable, {
      candidateDays: ["TUE", "THU"],
      candidateStartHour: 9,
      candidateEndHour: 12,
    });
    expect(result).toEqual([
      { day: "TUE", startHour: 11, endHour: 12 },
      { day: "THU", startHour: 11, endHour: 12 },
    ]);
  });

  it("정각에 시작하고 끝나는 수업은 해당 시간 블록만 제외된다", () => {
    // MON 10:00-12:00 → 10시, 11시 블록 불가
    const timetable: EverytimeTimetable = {
      lectures: [
        {
          name: "알고리즘",
          times: [{ day: 0, startMinute: 600, endMinute: 720 }],
        },
      ],
    };
    const result = timetableToFreeSlots(timetable, {
      candidateDays: ["MON"],
      candidateStartHour: 9,
      candidateEndHour: 14,
    });
    expect(result).toEqual([
      { day: "MON", startHour: 9, endHour: 10 },
      { day: "MON", startHour: 12, endHour: 14 },
    ]);
  });

  it("candidateStartHour >= candidateEndHour이면 에러를 throw한다", () => {
    const timetable: EverytimeTimetable = { lectures: [] };
    expect(() =>
      timetableToFreeSlots(timetable, {
        candidateStartHour: 12,
        candidateEndHour: 9,
      }),
    ).toThrow();
  });

  it("candidateStartHour가 음수이면 에러를 throw한다", () => {
    const timetable: EverytimeTimetable = { lectures: [] };
    expect(() =>
      timetableToFreeSlots(timetable, {
        candidateStartHour: -1,
        candidateEndHour: 22,
      }),
    ).toThrow();
  });

  it("candidateEndHour가 24 초과이면 에러를 throw한다", () => {
    const timetable: EverytimeTimetable = { lectures: [] };
    expect(() =>
      timetableToFreeSlots(timetable, {
        candidateStartHour: 9,
        candidateEndHour: 25,
      }),
    ).toThrow();
  });

  it("빈 candidateDays이면 빈 배열을 반환한다", () => {
    const timetable: EverytimeTimetable = { lectures: [] };
    const result = timetableToFreeSlots(timetable, {
      candidateDays: [],
      candidateStartHour: 9,
      candidateEndHour: 22,
    });
    expect(result).toEqual([]);
  });
});
