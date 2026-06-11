import type { DayCode, TimeSlot } from "@/types/schedule";
import type { EverytimeTimetable } from "@/types/everytime";

// ============================================================
// 에브리타임 시간표 → 빈 시간(TimeSlot[]) 변환기
//
// 에브리타임 시간표는 "수업 시간(바쁜 시간)"이다.
// MOIM의 findCommonSlots는 "가능한 시간(빈 시간)"을 입력받으므로
// 후보 시간대에서 수업 시간을 제외한 블록을 반환한다.
// ============================================================

const DAY_CODE_MAP: Record<number, DayCode> = {
  0: "MON",
  1: "TUE",
  2: "WED",
  3: "THU",
  4: "FRI",
  5: "SAT",
  6: "SUN",
};

const CODE_TO_DAY_NUM: Record<DayCode, number> = {
  MON: 0,
  TUE: 1,
  WED: 2,
  THU: 3,
  FRI: 4,
  SAT: 5,
  SUN: 6,
};

export interface TimetableConvertOptions {
  /** 후보 요일 (기본: 월~금) */
  candidateDays?: DayCode[];
  /** 후보 시작 시각 (기본: 9시) */
  candidateStartHour?: number;
  /** 후보 종료 시각 (기본: 22시) */
  candidateEndHour?: number;
}

/**
 * 에브리타임 시간표를 빈 시간 목록으로 변환한다.
 *
 * 수업이 없는 1시간 단위 블록을 추출하고, 연속된 블록은 하나의 TimeSlot으로 병합한다.
 *
 * @example
 * // MON 09:00-10:30 수업 → MON 11:00-22:00 빈 시간
 * timetableToFreeSlots(timetable, { candidateDays: ["MON"], candidateStartHour: 9, candidateEndHour: 22 })
 * // → [{ day: "MON", startHour: 11, endHour: 22 }]
 */
export function timetableToFreeSlots(
  timetable: EverytimeTimetable,
  options: TimetableConvertOptions = {},
): TimeSlot[] {
  const {
    candidateDays = ["MON", "TUE", "WED", "THU", "FRI"],
    candidateStartHour = 9,
    candidateEndHour = 22,
  } = options;

  if (candidateStartHour < 0 || candidateEndHour > 24) {
    throw new Error("시간 범위는 0~24 사이여야 합니다.");
  }
  if (candidateStartHour >= candidateEndHour) {
    throw new Error("candidateStartHour는 candidateEndHour보다 작아야 합니다.");
  }

  const result: TimeSlot[] = [];

  for (const day of candidateDays) {
    const dayNum = CODE_TO_DAY_NUM[day];

    const busyRanges = timetable.lectures
      .flatMap((l) => l.times)
      .filter((t) => t.day === dayNum);

    const freeHours: number[] = [];
    for (let h = candidateStartHour; h < candidateEndHour; h++) {
      const hourStartMin = h * 60;
      const hourEndMin = (h + 1) * 60;
      const isBusy = busyRanges.some(
        (b) => b.startMinute < hourEndMin && b.endMinute > hourStartMin,
      );
      if (!isBusy) freeHours.push(h);
    }

    result.push(...groupConsecutiveHours(day, freeHours));
  }

  return result;
}

/** 오름차순으로 정렬된 정수 시간 배열을 TimeSlot 블록으로 병합한다. */
function groupConsecutiveHours(day: DayCode, hours: number[]): TimeSlot[] {
  if (hours.length === 0) return [];

  const slots: TimeSlot[] = [];
  let blockStart = hours[0];
  let prev = hours[0];

  for (let i = 1; i < hours.length; i++) {
    if (hours[i] !== prev + 1) {
      slots.push({ day, startHour: blockStart, endHour: prev + 1 });
      blockStart = hours[i];
    }
    prev = hours[i];
  }
  slots.push({ day, startHour: blockStart, endHour: prev + 1 });

  return slots;
}

export { DAY_CODE_MAP };
