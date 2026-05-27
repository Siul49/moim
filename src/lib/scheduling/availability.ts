/**
 * 공통 가용시간 산출 — 요일+시간 / Date 기반 두 형태 모두 지원
 *
 * MOIM 서비스의 핵심 알고리즘. PRD 4.6 "통합 가용시간 산출 로직"의 구현체.
 *
 * 두 진입점:
 * - `findCommonSlots`     : 기존 `TimeSlot`(요일+정수 시간) 기반. 호환용 래퍼.
 * - `findCommonDateSlots` : 절대 시각(`DateTimeSlot`) 기반. Google/iCloud/AI 등
 *                            모든 신규 입력 경로의 표준 진입점.
 *
 * 두 함수 모두 입력 → 출력만 검증되는 순수 함수이므로 React/Next.js 환경 없이
 * 단독 테스트가 가능하다.
 */

import type {
  DateTimeSlot,
  ParticipantAvailability,
  ParticipantDateAvailability,
  TimeSlot,
} from "@/types/schedule";

export function findCommonSlots(
  participants: ParticipantAvailability[],
): TimeSlot[] {
  if (participants.length === 0) return [];
  if (participants.length === 1) return participants[0].available;

  let commonSlots = participants[0].available;

  for (let i = 1; i < participants.length; i++) {
    commonSlots = intersectSlots(commonSlots, participants[i].available);
    if (commonSlots.length === 0) return [];
  }

  return commonSlots;
}

function intersectSlots(slotsA: TimeSlot[], slotsB: TimeSlot[]): TimeSlot[] {
  const result: TimeSlot[] = [];

  for (const a of slotsA) {
    for (const b of slotsB) {
      if (a.day !== b.day) continue;

      const start = Math.max(a.startHour, b.startHour);
      const end = Math.min(a.endHour, b.endHour);

      if (start < end) {
        result.push({ day: a.day, startHour: start, endHour: end });
      }
    }
  }

  return result;
}

export interface FindCommonDateSlotsOptions {
  /** 회의 최소 길이(분). 교집합이 이 길이 미만이면 결과에서 제외한다. */
  durationMinutes?: number;
}

export function findCommonDateSlots(
  participants: ParticipantDateAvailability[],
  options: FindCommonDateSlotsOptions = {},
): DateTimeSlot[] {
  if (participants.length === 0) return [];

  const { durationMinutes = 0 } = options;
  const minMs = durationMinutes * 60_000;

  let common = participants[0].available;

  for (let i = 1; i < participants.length; i++) {
    common = intersectDateSlots(common, participants[i].available);
    if (common.length === 0) return [];
  }

  if (minMs > 0) {
    common = common.filter(
      (slot) => slot.endAt.getTime() - slot.startAt.getTime() >= minMs,
    );
  }

  return common;
}

function intersectDateSlots(
  slotsA: DateTimeSlot[],
  slotsB: DateTimeSlot[],
): DateTimeSlot[] {
  const result: DateTimeSlot[] = [];

  for (const a of slotsA) {
    for (const b of slotsB) {
      const start = Math.max(a.startAt.getTime(), b.startAt.getTime());
      const end = Math.min(a.endAt.getTime(), b.endAt.getTime());

      if (start < end) {
        result.push({ startAt: new Date(start), endAt: new Date(end) });
      }
    }
  }

  return result;
}
