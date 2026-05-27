import { describe, expect, test, afterEach } from "vitest";
import type { TimeSlot } from "@/types/schedule";
import {
  addParticipantAvailability,
  clearSchedules,
  createSchedule,
  getScheduleForHost,
  getSchedulePublic,
} from "../in-memory-store";

describe("in-memory schedule store", () => {
  afterEach(() => {
    clearSchedules();
  });

  test("creates an unguessable schedule id and keeps the host token out of public data", () => {
    const created = createSchedule({
      title: "제품 회의",
      durationMinutes: 60,
      candidateDays: ["MON", "TUE"],
      candidateStartHour: 9,
      candidateEndHour: 18,
    });

    expect(created.id).toMatch(/^[A-Za-z0-9_-]{20,}$/);
    expect(created.hostToken).toMatch(/^[A-Za-z0-9_-]{32,}$/);

    const publicSchedule = getSchedulePublic(created.id);

    expect(publicSchedule).toMatchObject({
      id: created.id,
      title: "제품 회의",
      participantCount: 0,
    });
    expect(publicSchedule).not.toHaveProperty("hostToken");
    expect(publicSchedule).not.toHaveProperty("participants");
  });

  test("requires the host token before returning participant details and common slots", () => {
    const created = createSchedule({
      title: "인터뷰 일정",
      durationMinutes: 60,
      candidateDays: ["MON"],
      candidateStartHour: 9,
      candidateEndHour: 18,
    });

    addParticipantAvailability(created.id, {
      name: "민지",
      available: [{ day: "MON", startHour: 10, endHour: 14 }],
    });
    addParticipantAvailability(created.id, {
      name: "준호",
      available: [{ day: "MON", startHour: 12, endHour: 16 }],
    });

    expect(getScheduleForHost(created.id, "wrong-token")).toBeNull();

    const hostSchedule = getScheduleForHost(created.id, created.hostToken);

    expect(hostSchedule?.participants.map((p) => p.name)).toEqual([
      "민지",
      "준호",
    ]);
    expect(hostSchedule?.commonSlots).toEqual([
      { day: "MON", startHour: 12, endHour: 14 },
    ]);
    expect(hostSchedule).not.toHaveProperty("hostToken");
  });

  test("rejects participant slots outside the schedule candidate window", () => {
    const created = createSchedule({
      title: "저녁 약속",
      durationMinutes: 60,
      candidateDays: ["FRI"],
      candidateStartHour: 18,
      candidateEndHour: 22,
    });
    const invalidSlot: TimeSlot = {
      day: "THU",
      startHour: 18,
      endHour: 20,
    };

    expect(() =>
      addParticipantAvailability(created.id, {
        name: "수아",
        available: [invalidSlot],
      }),
    ).toThrow("candidate window");
  });

  test("rejects empty participant names and empty availability", () => {
    const created = createSchedule({
      title: "스터디",
      durationMinutes: 60,
      candidateDays: ["SAT"],
      candidateStartHour: 10,
      candidateEndHour: 14,
    });

    expect(() =>
      addParticipantAvailability(created.id, {
        name: "",
        available: [{ day: "SAT", startHour: 10, endHour: 11 }],
      }),
    ).toThrow("name");

    expect(() =>
      addParticipantAvailability(created.id, {
        name: "하린",
        available: [],
      }),
    ).toThrow("availability");
  });
});
