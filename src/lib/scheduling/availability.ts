/**
 * findCommonSlots — 여러 참여자의 공통 가용시간 교집합을 구한다
 *
 * MOIM 서비스의 핵심 알고리즘.
 * PRD 4.6 "통합 가용시간 산출 로직"의 구현체.
 *
 * 원리:
 * 1. 같은 요일끼리 그룹핑
 * 2. 각 요일에서 모든 참여자의 시간 범위 교집합을 계산
 * 3. 교집합이 존재하는 슬롯만 반환
 *
 * 왜 순수 함수로 분리하나?
 * - React/Next.js와 독립적이라 테스트가 매우 쉽다
 * - 입력 → 출력만 검증하면 되므로 TDD에 최적
 * - Python으로 비유하면, FastAPI 라우터가 아니라 utils.py에 있는 계산 함수
 */

import type { ParticipantAvailability, TimeSlot } from "@/types/schedule";

/**
 * 여러 참여자의 가용시간 중 모두가 겹치는 공통 시간대를 찾는다.
 *
 * @param participants - 각 참여자의 가용시간 배열
 * @returns 모든 참여자가 동시에 가능한 TimeSlot 배열
 *
 * @example
 * // A: 월 10~15시, B: 월 13~18시 → 교집합: 월 13~15시
 * findCommonSlots([
 *   { userId: 'a', available: [{ day: 'MON', startHour: 10, endHour: 15 }] },
 *   { userId: 'b', available: [{ day: 'MON', startHour: 13, endHour: 18 }] },
 * ])
 * // → [{ day: 'MON', startHour: 13, endHour: 15 }]
 */
export function findCommonSlots(
  participants: ParticipantAvailability[],
): TimeSlot[] {
  if (participants.length === 0) return [];
  if (participants.length === 1) return participants[0].available;

  // 첫 번째 참여자의 슬롯에서 시작하여 나머지와 교집합을 누적
  let commonSlots = participants[0].available;

  for (let i = 1; i < participants.length; i++) {
    commonSlots = intersectSlots(commonSlots, participants[i].available);
    // 교집합이 비면 더 이상 계산할 필요 없음 (조기 종료)
    if (commonSlots.length === 0) return [];
  }

  return commonSlots;
}

/**
 * 두 슬롯 배열의 교집합을 구한다.
 * 같은 요일의 시간 범위가 겹치는 부분만 추출.
 */
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
