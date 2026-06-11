/**
 * findCommonSlots 테스트
 *
 * TDD Red→Green→Refactor 사이클의 "Red" 단계에서 먼저 작성된 테스트.
 * 이 테스트들이 실패하는 상태에서 availability.ts를 구현하여 통과시켰다.
 *
 * 테스트 파일이 대상 코드 바로 옆(__tests__/)에 있는 이유:
 * - 관련 파일을 한눈에 볼 수 있어 유지보수가 쉬움
 * - AI에게 "이 파일 테스트 작성해줘"라고 할 때 컨텍스트 파악이 빠름
 * - pytest의 test_*.py 파일이 대상 모듈 옆에 있는 것과 같은 패턴
 */

import { describe, test, expect } from "vitest";
import { findCommonSlots } from "../availability";
import type { ParticipantAvailability } from "@/types/schedule";

describe("findCommonSlots - 공통 가용시간 교집합", () => {
  test("두 참여자의 겹치는 시간대를 반환한다", () => {
    const userA: ParticipantAvailability = {
      userId: "a",
      available: [{ day: "MON", startHour: 10, endHour: 15 }],
    };
    const userB: ParticipantAvailability = {
      userId: "b",
      available: [{ day: "MON", startHour: 13, endHour: 18 }],
    };

    const result = findCommonSlots([userA, userB]);

    expect(result).toEqual([{ day: "MON", startHour: 13, endHour: 15 }]);
  });

  test("겹치는 시간이 없으면 빈 배열을 반환한다", () => {
    const userA: ParticipantAvailability = {
      userId: "a",
      available: [{ day: "MON", startHour: 9, endHour: 12 }],
    };
    const userB: ParticipantAvailability = {
      userId: "b",
      available: [{ day: "MON", startHour: 14, endHour: 17 }],
    };

    const result = findCommonSlots([userA, userB]);

    expect(result).toEqual([]);
  });

  test("참여자가 한 명이면 그 사람의 가용시간을 그대로 반환한다", () => {
    const solo: ParticipantAvailability = {
      userId: "solo",
      available: [{ day: "TUE", startHour: 10, endHour: 14 }],
    };

    const result = findCommonSlots([solo]);

    expect(result).toEqual([{ day: "TUE", startHour: 10, endHour: 14 }]);
  });

  test("빈 참여자 배열이면 빈 배열을 반환한다", () => {
    const result = findCommonSlots([]);
    expect(result).toEqual([]);
  });

  test("세 명 이상의 교집합을 계산한다", () => {
    const userA: ParticipantAvailability = {
      userId: "a",
      available: [{ day: "WED", startHour: 9, endHour: 17 }],
    };
    const userB: ParticipantAvailability = {
      userId: "b",
      available: [{ day: "WED", startHour: 12, endHour: 20 }],
    };
    const userC: ParticipantAvailability = {
      userId: "c",
      available: [{ day: "WED", startHour: 14, endHour: 18 }],
    };

    const result = findCommonSlots([userA, userB, userC]);

    // 9~17 ∩ 12~20 = 12~17, 12~17 ∩ 14~18 = 14~17
    expect(result).toEqual([{ day: "WED", startHour: 14, endHour: 17 }]);
  });

  test("서로 다른 요일은 교집합이 없다", () => {
    const userA: ParticipantAvailability = {
      userId: "a",
      available: [{ day: "MON", startHour: 10, endHour: 15 }],
    };
    const userB: ParticipantAvailability = {
      userId: "b",
      available: [{ day: "TUE", startHour: 10, endHour: 15 }],
    };

    const result = findCommonSlots([userA, userB]);

    expect(result).toEqual([]);
  });

  test("한 요일에 여러 슬롯이 있는 경우를 제대로 처리한다", () => {
    const userA: ParticipantAvailability = {
      userId: "a",
      available: [
        { day: "MON", startHour: 10, endHour: 12 },
        { day: "MON", startHour: 14, endHour: 16 },
      ],
    };
    const userB: ParticipantAvailability = {
      userId: "b",
      available: [{ day: "MON", startHour: 11, endHour: 15 }],
    };

    const result = findCommonSlots([userA, userB]);

    // A: 10~12, 14~16
    // B: 11~15
    // 교집합: 11~12, 14~15
    expect(result).toEqual([
      { day: "MON", startHour: 11, endHour: 12 },
      { day: "MON", startHour: 14, endHour: 15 },
    ]);
  });

  test("시작 시간과 종료 시간이 같은 슬롯은 교집합에서 무시하거나 빈 범위를 만든다", () => {
    const userA: ParticipantAvailability = {
      userId: "a",
      available: [{ day: "MON", startHour: 10, endHour: 10 }],
    };
    const userB: ParticipantAvailability = {
      userId: "b",
      available: [{ day: "MON", startHour: 9, endHour: 11 }],
    };

    const result = findCommonSlots([userA, userB]);

    // 교집합은 10~10으로 크기가 0이므로 실제 유효 슬롯이 아님 (하지만 방어 로직대로 동작)
    expect(result).toEqual([]);
  });
});
