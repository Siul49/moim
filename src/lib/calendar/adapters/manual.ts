/**
 * 수동 입력(When2meet 스타일 그리드) → 표준 CalendarEvent 어댑터
 *
 * 사용자가 그리드에서 "이 시간 가능"으로 선택한 결과는 요일+정수 시간
 * (`TimeSlot`) 형태다. 이는 **busy가 아니라 free** 정보이므로, 통합 가용시간
 * 계산을 위해 다음 두 진입점을 제공한다:
 *
 * - `manualSlotsToFreeEvents` : 그리드 선택을 free `CalendarEvent[]`로 변환
 *   (busy 이벤트가 없는 일정 입력 경로 — Google/iCloud 미연동 사용자용)
 *
 * 그리드는 요일 단위라 절대 날짜 정보가 없다. 호출자가 `weekStart`(월요일
 * 0시)를 넘기면 해당 주의 절대 시각으로 환산해 반환한다.
 */

import type { TimeSlot, DayCode } from "@/types/schedule";
import type { CalendarEvent } from "@/types/calendar-event";

const DAY_OFFSET: Record<DayCode, number> = {
  MON: 0,
  TUE: 1,
  WED: 2,
  THU: 3,
  FRI: 4,
  SAT: 5,
  SUN: 6,
};

export interface ManualToFreeOptions {
  /** 기준 주의 월요일 0시 (호출자 timezone). 없으면 이번 주 월요일 사용. */
  weekStart?: Date;
}

export function manualSlotsToFreeEvents(
  slots: TimeSlot[],
  options: ManualToFreeOptions = {},
): CalendarEvent[] {
  const weekStart = options.weekStart ?? getThisMonday();

  return slots.map((slot, idx) => {
    const startAt = addHours(weekStart, DAY_OFFSET[slot.day] * 24 + slot.startHour);
    const endAt = addHours(weekStart, DAY_OFFSET[slot.day] * 24 + slot.endHour);
    return {
      id: `manual:${idx}:${slot.day}-${slot.startHour}-${slot.endHour}`,
      title: "가용",
      startAt,
      endAt,
      isAllDay: false,
      source: "manual" as const,
    };
  });
}

function addHours(base: Date, hours: number): Date {
  const next = new Date(base);
  next.setHours(next.getHours() + hours);
  return next;
}

function getThisMonday(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun ... 6=Sat
  const diffFromMonday = (day + 6) % 7;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - diffFromMonday);
  return monday;
}
