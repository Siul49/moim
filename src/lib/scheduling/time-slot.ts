/**
 * 시간 슬롯 유틸리티 — 정렬과 병합
 *
 * 요일+정수 시간(`TimeSlot`)과 절대 시각(`DateTimeSlot`) 두 형태 모두를 지원한다.
 * 두 표현 사이의 변환은 어댑터 계층(`@/lib/calendar/adapters`)에서 수행하며,
 * 본 모듈은 입력 형태를 그대로 보존한 채 정렬·병합만 책임진다.
 */

import type { DayCode, DateTimeSlot, TimeSlot } from "@/types/schedule";

const DAY_ORDER: Record<DayCode, number> = {
  MON: 0,
  TUE: 1,
  WED: 2,
  THU: 3,
  FRI: 4,
  SAT: 5,
  SUN: 6,
};

export function sortSlots(slots: TimeSlot[]): TimeSlot[] {
  return [...slots].sort((a, b) => {
    const dayDiff = DAY_ORDER[a.day] - DAY_ORDER[b.day];
    if (dayDiff !== 0) return dayDiff;
    return a.startHour - b.startHour;
  });
}

export function mergeOverlapping(slots: TimeSlot[]): TimeSlot[] {
  if (slots.length === 0) return [];

  const sorted = sortSlots(slots);
  const result: TimeSlot[] = [];

  for (const slot of sorted) {
    const last = result[result.length - 1];
    if (last && last.day === slot.day && slot.startHour <= last.endHour) {
      last.endHour = Math.max(last.endHour, slot.endHour);
    } else {
      result.push({ ...slot });
    }
  }

  return result;
}

export function sortDateSlots(slots: DateTimeSlot[]): DateTimeSlot[] {
  return [...slots].sort(
    (a, b) => a.startAt.getTime() - b.startAt.getTime(),
  );
}

export function mergeOverlappingDateSlots(
  slots: DateTimeSlot[],
): DateTimeSlot[] {
  if (slots.length === 0) return [];

  const sorted = sortDateSlots(slots);
  const result: DateTimeSlot[] = [];

  for (const slot of sorted) {
    const last = result[result.length - 1];
    if (last && slot.startAt.getTime() <= last.endAt.getTime()) {
      if (slot.endAt.getTime() > last.endAt.getTime()) {
        last.endAt = slot.endAt;
      }
    } else {
      result.push({ startAt: slot.startAt, endAt: slot.endAt });
    }
  }

  return result;
}
