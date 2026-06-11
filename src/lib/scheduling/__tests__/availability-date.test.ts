import { describe, test, expect } from "vitest";
import { findCommonDateSlots } from "../availability";
import type { ParticipantDateAvailability } from "@/types/schedule";

const iso = (s: string) => new Date(s);

const slot = (startAt: string, endAt: string) => ({
  startAt: iso(startAt),
  endAt: iso(endAt),
});

describe("findCommonDateSlots — Date 기반 공통 가용시간", () => {
  test("두 참여자의 겹치는 Date 시간대를 반환한다", () => {
    const userA: ParticipantDateAvailability = {
      userId: "a",
      available: [slot("2026-05-10T10:00:00Z", "2026-05-10T15:00:00Z")],
    };
    const userB: ParticipantDateAvailability = {
      userId: "b",
      available: [slot("2026-05-10T13:00:00Z", "2026-05-10T18:00:00Z")],
    };

    const result = findCommonDateSlots([userA, userB]);

    expect(result).toEqual([
      {
        startAt: iso("2026-05-10T13:00:00Z"),
        endAt: iso("2026-05-10T15:00:00Z"),
      },
    ]);
  });

  test("durationMinutes 미만의 슬롯은 제외한다", () => {
    const userA: ParticipantDateAvailability = {
      userId: "a",
      available: [slot("2026-05-10T10:00:00Z", "2026-05-10T11:00:00Z")],
    };
    const userB: ParticipantDateAvailability = {
      userId: "b",
      available: [slot("2026-05-10T10:30:00Z", "2026-05-10T11:00:00Z")],
    };

    // 교집합 30분이지만 60분 회의는 불가
    const result = findCommonDateSlots([userA, userB], {
      durationMinutes: 60,
    });

    expect(result).toEqual([]);
  });

  test("durationMinutes 충족 슬롯만 반환한다", () => {
    const userA: ParticipantDateAvailability = {
      userId: "a",
      available: [slot("2026-05-10T10:00:00Z", "2026-05-10T13:00:00Z")],
    };
    const userB: ParticipantDateAvailability = {
      userId: "b",
      available: [slot("2026-05-10T11:00:00Z", "2026-05-10T13:30:00Z")],
    };

    const result = findCommonDateSlots([userA, userB], {
      durationMinutes: 90,
    });

    expect(result).toEqual([
      {
        startAt: iso("2026-05-10T11:00:00Z"),
        endAt: iso("2026-05-10T13:00:00Z"),
      },
    ]);
  });

  test("겹치는 시간대가 없으면 빈 배열", () => {
    const userA: ParticipantDateAvailability = {
      userId: "a",
      available: [slot("2026-05-10T09:00:00Z", "2026-05-10T11:00:00Z")],
    };
    const userB: ParticipantDateAvailability = {
      userId: "b",
      available: [slot("2026-05-10T13:00:00Z", "2026-05-10T15:00:00Z")],
    };

    expect(findCommonDateSlots([userA, userB])).toEqual([]);
  });

  test("참여자 0명이면 빈 배열, 1명이면 본인 가용시간 그대로", () => {
    expect(findCommonDateSlots([])).toEqual([]);

    const solo: ParticipantDateAvailability = {
      userId: "solo",
      available: [slot("2026-05-10T10:00:00Z", "2026-05-10T12:00:00Z")],
    };
    expect(findCommonDateSlots([solo])).toEqual(solo.available);
  });

  test("3명 이상의 교집합", () => {
    const a: ParticipantDateAvailability = {
      userId: "a",
      available: [slot("2026-05-10T09:00:00Z", "2026-05-10T17:00:00Z")],
    };
    const b: ParticipantDateAvailability = {
      userId: "b",
      available: [slot("2026-05-10T12:00:00Z", "2026-05-10T20:00:00Z")],
    };
    const c: ParticipantDateAvailability = {
      userId: "c",
      available: [slot("2026-05-10T14:00:00Z", "2026-05-10T18:00:00Z")],
    };

    const result = findCommonDateSlots([a, b, c]);

    expect(result).toEqual([
      {
        startAt: iso("2026-05-10T14:00:00Z"),
        endAt: iso("2026-05-10T17:00:00Z"),
      },
    ]);
  });

  test("한 명이 여러 슬롯을 가진 경우도 모두 처리한다", () => {
    const a: ParticipantDateAvailability = {
      userId: "a",
      available: [
        slot("2026-05-10T09:00:00Z", "2026-05-10T11:00:00Z"),
        slot("2026-05-10T14:00:00Z", "2026-05-10T16:00:00Z"),
      ],
    };
    const b: ParticipantDateAvailability = {
      userId: "b",
      available: [slot("2026-05-10T10:00:00Z", "2026-05-10T15:00:00Z")],
    };

    const result = findCommonDateSlots([a, b]);

    expect(result).toEqual([
      {
        startAt: iso("2026-05-10T10:00:00Z"),
        endAt: iso("2026-05-10T11:00:00Z"),
      },
      {
        startAt: iso("2026-05-10T14:00:00Z"),
        endAt: iso("2026-05-10T15:00:00Z"),
      },
    ]);
  });
});
