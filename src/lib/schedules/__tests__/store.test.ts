import { describe, expect, test, afterEach } from "vitest";
import type { TimeSlot } from "@/types/schedule";
import {
  addParticipantAvailability,
  clearSchedules,
  confirmSchedule,
  createSchedule,
  getScheduleForHost,
  getSchedulePublic,
} from "../store";

describe("schedule store", () => {
  afterEach(async () => {
    await clearSchedules();
  });

  test("creates an unguessable schedule id and keeps the host token out of public data", async () => {
    const created = await createSchedule({
      title: "제품 회의",
      durationMinutes: 60,
      candidateDays: ["MON", "TUE"],
      candidateStartHour: 9,
      candidateEndHour: 18,
    });

    expect(created.id).toMatch(/^[A-Za-z0-9_-]{20,}$/);
    expect(created.hostToken).toMatch(/^[A-Za-z0-9_-]{32,}$/);

    const publicSchedule = await getSchedulePublic(created.id);

    expect(publicSchedule).toMatchObject({
      id: created.id,
      title: "제품 회의",
      participantCount: 0,
    });
    expect(publicSchedule).not.toHaveProperty("hostToken");
    expect(publicSchedule).not.toHaveProperty("participants");
  });

  test("persists schedules across fresh reads", async () => {
    const created = await createSchedule({
      title: "저장 확인",
      durationMinutes: 45,
      candidateDays: ["WED"],
      candidateStartHour: 13,
      candidateEndHour: 17,
    });

    const firstRead = await getSchedulePublic(created.id);
    const secondRead = await getSchedulePublic(created.id);

    expect(firstRead?.title).toBe("저장 확인");
    expect(secondRead).toEqual(firstRead);
  });

  test("requires the host token before returning participant details and common slots", async () => {
    const created = await createSchedule({
      title: "인터뷰 일정",
      durationMinutes: 60,
      candidateDays: ["MON"],
      candidateStartHour: 9,
      candidateEndHour: 18,
    });

    await addParticipantAvailability(created.id, {
      name: "민지",
      available: [{ day: "MON", startHour: 10, endHour: 14 }],
    });
    await addParticipantAvailability(created.id, {
      name: "준호",
      available: [{ day: "MON", startHour: 12, endHour: 16 }],
    });

    expect(await getScheduleForHost(created.id, "wrong-token")).toBeNull();

    const hostSchedule = await getScheduleForHost(
      created.id,
      created.hostToken,
    );

    expect(hostSchedule?.participants.map((p) => p.name)).toEqual([
      "민지",
      "준호",
    ]);
    expect(hostSchedule?.commonSlots).toEqual([
      { day: "MON", startHour: 12, endHour: 14 },
    ]);
    expect(hostSchedule).not.toHaveProperty("hostToken");
  });

  test("rejects participant slots outside the schedule candidate window", async () => {
    const created = await createSchedule({
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

    await expect(
      addParticipantAvailability(created.id, {
        name: "수아",
        available: [invalidSlot],
      }),
    ).rejects.toThrow("candidate window");
  });

  test("rejects empty participant names", async () => {
    const created = await createSchedule({
      title: "스터디",
      durationMinutes: 60,
      candidateDays: ["SAT"],
      candidateStartHour: 10,
      candidateEndHour: 14,
    });

    await expect(
      addParticipantAvailability(created.id, {
        name: "",
        available: [{ day: "SAT", startHour: 10, endHour: 11 }],
      }),
    ).rejects.toThrow("name");
  });

  test("rejects empty availability", async () => {
    const created = await createSchedule({
      title: "스터디",
      durationMinutes: 60,
      candidateDays: ["SAT"],
      candidateStartHour: 10,
      candidateEndHour: 14,
    });

    await expect(
      addParticipantAvailability(created.id, {
        name: "하린",
        available: [],
      }),
    ).rejects.toThrow("availability");
  });

  test("lets the host confirm one of the common slots", async () => {
    const created = await createSchedule({
      title: "주간 회의",
      durationMinutes: 60,
      candidateDays: ["FRI"],
      candidateStartHour: 18,
      candidateEndHour: 22,
    });

    await addParticipantAvailability(created.id, {
      name: "민지",
      available: [{ day: "FRI", startHour: 19, endHour: 21 }],
    });
    await addParticipantAvailability(created.id, {
      name: "준호",
      available: [{ day: "FRI", startHour: 19, endHour: 22 }],
    });

    const confirmed = await confirmSchedule(created.id, created.hostToken, {
      day: "FRI",
      startHour: 19,
      endHour: 20,
    });

    expect(confirmed.status).toBe("confirmed");
    expect(confirmed.confirmedSlot).toEqual({
      day: "FRI",
      startHour: 19,
      endHour: 20,
    });
    expect((await getSchedulePublic(created.id))?.status).toBe("confirmed");
  });

  test("rejects participant availability after the schedule is confirmed", async () => {
    const created = await createSchedule({
      title: "confirmed schedule",
      durationMinutes: 60,
      candidateDays: ["FRI"],
      candidateStartHour: 18,
      candidateEndHour: 22,
    });

    await addParticipantAvailability(created.id, {
      name: "first",
      available: [{ day: "FRI", startHour: 19, endHour: 21 }],
    });
    await confirmSchedule(created.id, created.hostToken, {
      day: "FRI",
      startHour: 19,
      endHour: 20,
    });

    await expect(
      addParticipantAvailability(created.id, {
        name: "late",
        available: [{ day: "FRI", startHour: 19, endHour: 20 }],
      }),
    ).rejects.toThrow("not open");
  });

  test("rejects confirming an already confirmed schedule", async () => {
    const created = await createSchedule({
      title: "single confirmation",
      durationMinutes: 60,
      candidateDays: ["FRI"],
      candidateStartHour: 18,
      candidateEndHour: 22,
    });

    await addParticipantAvailability(created.id, {
      name: "first",
      available: [{ day: "FRI", startHour: 19, endHour: 21 }],
    });
    await confirmSchedule(created.id, created.hostToken, {
      day: "FRI",
      startHour: 19,
      endHour: 20,
    });

    await expect(
      confirmSchedule(created.id, created.hostToken, {
        day: "FRI",
        startHour: 19,
        endHour: 20,
      }),
    ).rejects.toThrow("not open");
  });

  test("rejects confirmation with an invalid host token", async () => {
    const created = await createSchedule({
      title: "주간 회의",
      durationMinutes: 60,
      candidateDays: ["FRI"],
      candidateStartHour: 18,
      candidateEndHour: 22,
    });

    await expect(
      confirmSchedule(created.id, "wrong-token", {
        day: "FRI",
        startHour: 19,
        endHour: 20,
      }),
    ).rejects.toThrow("invalid host token");
  });

  test("rejects confirmation outside the current common slots", async () => {
    const created = await createSchedule({
      title: "주간 회의",
      durationMinutes: 60,
      candidateDays: ["FRI"],
      candidateStartHour: 18,
      candidateEndHour: 22,
    });

    await addParticipantAvailability(created.id, {
      name: "민지",
      available: [{ day: "FRI", startHour: 19, endHour: 20 }],
    });
    await addParticipantAvailability(created.id, {
      name: "준호",
      available: [{ day: "FRI", startHour: 20, endHour: 21 }],
    });

    await expect(
      confirmSchedule(created.id, created.hostToken, {
        day: "FRI",
        startHour: 19,
        endHour: 20,
      }),
    ).rejects.toThrow("common slots");
  });
});
