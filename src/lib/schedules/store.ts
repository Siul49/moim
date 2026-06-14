import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { Prisma } from "@prisma/client";
import type {
  DayCode,
  ParticipantAvailability,
  TimeSlot,
} from "@/types/schedule";
import { prisma } from "@/lib/prisma";
import { findCommonSlots } from "@/lib/scheduling/availability";
import { mergeOverlapping, sortSlots } from "@/lib/scheduling/time-slot";

export interface CreateScheduleInput {
  title: string;
  durationMinutes: number;
  candidateDays: DayCode[];
  candidateStartHour: number;
  candidateEndHour: number;
  creatorId?: string | null;
}

export interface AddParticipantAvailabilityInput {
  name: string;
  available: TimeSlot[];
  userId?: string;
}

export interface CreatedSchedule {
  id: string;
  hostToken: string;
}

export interface PublicSchedule {
  id: string;
  title: string;
  durationMinutes: number;
  candidateDays: DayCode[];
  candidateStartHour: number;
  candidateEndHour: number;
  participantCount: number;
  status: "open" | "confirmed";
  confirmedSlot?: TimeSlot;
  createdAt: string;
  creatorId?: string | null;
}

export interface ScheduleParticipant {
  id: string;
  name: string;
  available: TimeSlot[];
  submittedAt: string;
  userId?: string | null;
}

export interface HostSchedule extends PublicSchedule {
  participants: ScheduleParticipant[];
  commonSlots: TimeSlot[];
}

type ScheduleWithParticipants = Prisma.ScheduleGetPayload<{
  include: { participants: true };
}>;

type ScheduleWithParticipantCount = Prisma.ScheduleGetPayload<{
  include: { _count: { select: { participants: true } } };
}>;

type NormalizedScheduleInput = Omit<CreateScheduleInput, "candidateDays"> & {
  candidateDays: DayCode[];
};

const VALID_DAYS: DayCode[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export async function createSchedule(
  input: CreateScheduleInput,
): Promise<CreatedSchedule> {
  const schedule = normalizeScheduleInput(input);
  const id = createToken(18);
  const hostToken = createToken(32);

  await prisma.schedule.create({
    data: {
      ...schedule,
      id,
      hostTokenHash: hashToken(hostToken),
      candidateDays: JSON.stringify(schedule.candidateDays),
    },
  });

  return { id, hostToken };
}

export async function getSchedulePublic(
  id: string,
): Promise<PublicSchedule | null> {
  const schedule = await prisma.schedule.findUnique({
    where: { id },
    include: { _count: { select: { participants: true } } },
  });
  if (!schedule) return null;
  return toPublicSchedule(schedule);
}

export async function getScheduleForHost(
  id: string,
  hostToken: string,
): Promise<HostSchedule | null> {
  const schedule = await prisma.schedule.findUnique({
    where: { id },
    include: { participants: true },
  });
  if (!schedule || !tokenMatches(schedule.hostTokenHash, hostToken)) {
    return null;
  }

  return toHostSchedule(schedule);
}

export async function getScheduleForCreator(
  id: string,
  creatorId: string,
): Promise<HostSchedule | null> {
  const schedule = await prisma.schedule.findUnique({
    where: { id },
    include: { participants: true },
  });
  if (!schedule || schedule.creatorId !== creatorId) {
    return null;
  }

  return toHostSchedule(schedule);
}

// 토큰/생성자 확인 없이 집계 결과(참여자·공통시간)를 반환한다.
// 참여 링크를 가진 누구나 결과 화면을 볼 수 있도록 허용하며,
// 호스트 전용 컨트롤(확정/카톡)은 프론트에서 isHost로 게이팅한다.
export async function getScheduleResult(
  id: string,
): Promise<HostSchedule | null> {
  const schedule = await prisma.schedule.findUnique({
    where: { id },
    include: { participants: true },
  });
  if (!schedule) return null;
  return toHostSchedule(schedule);
}

export async function getScheduleParticipantForUser(
  scheduleId: string,
  userId: string,
): Promise<ScheduleParticipant | null> {
  if (!userId) return null;

  const participant = await prisma.scheduleParticipant.findFirst({
    where: { scheduleId, userId },
  });
  if (!participant) return null;
  return toScheduleParticipant(participant);
}

export async function addParticipantAvailability(
  scheduleId: string,
  input: AddParticipantAvailabilityInput,
): Promise<ScheduleParticipant> {
  const participant = await prisma.$transaction(
    async (tx) => {
      const schedule = await tx.schedule.findUnique({
        where: { id: scheduleId },
      });
      if (!schedule) throw new Error("schedule not found");
      if (schedule.status !== "open") {
        throw new Error("schedule is not open");
      }

      const updateResult = await tx.schedule.updateMany({
        where: { id: scheduleId, status: "open" },
        data: { status: "open" },
      });
      if (updateResult.count !== 1) {
        throw new Error("schedule is not open");
      }

      const normName = normalizeParticipantName(input.name);
      const existing = await tx.scheduleParticipant.findFirst({
        where: input.userId
          ? { scheduleId, userId: input.userId }
          : { scheduleId, name: normName },
      });

      if (existing) {
        return tx.scheduleParticipant.update({
          where: { id: existing.id },
          data: {
            name: normName,
            available: JSON.stringify(
              normalizeAvailability(schedule, input.available),
            ),
            submittedAt: new Date(),
            userId: input.userId ?? existing.userId,
          },
        });
      }

      return tx.scheduleParticipant.create({
        data: {
          id: createToken(12),
          scheduleId,
          name: normName,
          available: JSON.stringify(
            normalizeAvailability(schedule, input.available),
          ),
          userId: input.userId,
        },
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );

  return toScheduleParticipant(participant);
}

export async function confirmSchedule(
  id: string,
  hostToken: string,
  confirmedSlot: TimeSlot,
): Promise<HostSchedule> {
  const updated = await prisma.$transaction(
    async (tx) => {
      const schedule = await tx.schedule.findUnique({
        where: { id },
        include: { participants: true },
      });
      if (!schedule) throw new Error("schedule not found");
      if (!tokenMatches(schedule.hostTokenHash, hostToken)) {
        throw new Error("invalid host token");
      }
      if (schedule.status !== "open") {
        throw new Error("schedule is not open");
      }

      const normalizedSlot = normalizeConfirmedSlot(schedule, confirmedSlot);
      const updateResult = await tx.schedule.updateMany({
        where: { id, status: "open" },
        data: {
          status: "confirmed",
          confirmedSlot: JSON.stringify(normalizedSlot),
        },
      });
      if (updateResult.count !== 1) {
        throw new Error("schedule is not open");
      }

      return tx.schedule.findUnique({
        where: { id },
        include: { participants: true },
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );

  if (!updated) throw new Error("schedule not found");
  return toHostSchedule(updated);
}

export async function confirmScheduleByCreator(
  id: string,
  creatorId: string,
  confirmedSlot: TimeSlot,
): Promise<HostSchedule> {
  const updated = await prisma.$transaction(
    async (tx) => {
      const schedule = await tx.schedule.findUnique({
        where: { id },
        include: { participants: true },
      });
      if (!schedule) throw new Error("schedule not found");
      if (schedule.creatorId !== creatorId) {
        throw new Error("invalid host token");
      }
      if (schedule.status !== "open") {
        throw new Error("schedule is not open");
      }

      const normalizedSlot = normalizeConfirmedSlot(schedule, confirmedSlot);
      const updateResult = await tx.schedule.updateMany({
        where: { id, status: "open" },
        data: {
          status: "confirmed",
          confirmedSlot: JSON.stringify(normalizedSlot),
        },
      });
      if (updateResult.count !== 1) {
        throw new Error("schedule is not open");
      }

      return tx.schedule.findUnique({
        where: { id },
        include: { participants: true },
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );

  if (!updated) throw new Error("schedule not found");
  return toHostSchedule(updated);
}

export async function deleteScheduleByCreator(
  id: string,
  creatorId: string,
): Promise<void> {
  const schedule = await prisma.schedule.findUnique({ where: { id } });
  if (!schedule) throw new Error("schedule not found");
  if (schedule.creatorId !== creatorId) throw new Error("forbidden");
  // 참여자(ScheduleParticipant)는 Prisma onDelete: Cascade로 함께 삭제됨
  await prisma.schedule.delete({ where: { id } });
}

export async function clearSchedules() {
  await prisma.$transaction([
    prisma.scheduleParticipant.deleteMany(),
    prisma.schedule.deleteMany(),
  ]);
}

function normalizeScheduleInput(
  input: CreateScheduleInput,
): NormalizedScheduleInput {
  const title = input.title.trim();
  if (title.length < 2 || title.length > 80) {
    throw new Error("title must be between 2 and 80 characters");
  }

  if (
    !Number.isInteger(input.durationMinutes) ||
    input.durationMinutes < 15 ||
    input.durationMinutes > 480
  ) {
    throw new Error("durationMinutes must be between 15 and 480");
  }

  const candidateDays = input.candidateDays.filter(
    (day, index, days) => days.indexOf(day) === index,
  );
  if (candidateDays.length === 0) {
    throw new Error("candidateDays must not be empty");
  }
  for (const day of candidateDays) {
    if (!VALID_DAYS.includes(day)) {
      throw new Error("candidateDays contains an invalid day");
    }
  }

  validateHourRange(input.candidateStartHour, input.candidateEndHour);

  const candidateWindowMinutes =
    (input.candidateEndHour - input.candidateStartHour) * 60;
  if (candidateWindowMinutes < input.durationMinutes) {
    throw new Error("durationMinutes must not exceed the candidate time range");
  }

  return {
    title,
    durationMinutes: input.durationMinutes,
    candidateDays,
    candidateStartHour: input.candidateStartHour,
    candidateEndHour: input.candidateEndHour,
    creatorId: input.creatorId,
  };
}

function normalizeParticipantName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 40) {
    throw new Error("participant name must be between 1 and 40 characters");
  }
  return trimmed;
}

function normalizeAvailability(
  schedule: {
    candidateDays: string;
    candidateStartHour: number;
    candidateEndHour: number;
  },
  available: TimeSlot[],
): TimeSlot[] {
  if (available.length === 0) {
    throw new Error("availability must not be empty");
  }

  const candidateDays = parseDayCodes(schedule.candidateDays);
  for (const slot of available) {
    validateHourRange(slot.startHour, slot.endHour);
    if (
      !candidateDays.includes(slot.day) ||
      slot.startHour < schedule.candidateStartHour ||
      slot.endHour > schedule.candidateEndHour
    ) {
      throw new Error("availability must stay inside the candidate window");
    }
  }

  return mergeOverlapping(sortSlots(available)).map((slot) => ({ ...slot }));
}

function normalizeConfirmedSlot(
  schedule: ScheduleWithParticipants,
  confirmedSlot: TimeSlot,
): TimeSlot {
  validateHourRange(confirmedSlot.startHour, confirmedSlot.endHour);
  const normalizedSlot = { ...confirmedSlot };
  const candidateDays = parseDayCodes(schedule.candidateDays);
  if (
    !candidateDays.includes(normalizedSlot.day) ||
    normalizedSlot.startHour < schedule.candidateStartHour ||
    normalizedSlot.endHour > schedule.candidateEndHour
  ) {
    throw new Error("confirmed slot must stay inside the candidate window");
  }

  const participants = schedule.participants.map(toScheduleParticipant);
  const commonSlots = findCommonSlots(
    participants.map((participant) => ({
      userId: participant.id,
      available: participant.available,
    })),
  );
  if (!commonSlots.some((slot) => containsSlot(slot, normalizedSlot))) {
    throw new Error("confirmed slot must be inside the current common slots");
  }

  return normalizedSlot;
}

function containsSlot(container: TimeSlot, target: TimeSlot): boolean {
  return (
    container.day === target.day &&
    container.startHour <= target.startHour &&
    container.endHour >= target.endHour
  );
}

function validateHourRange(startHour: number, endHour: number) {
  if (
    !Number.isInteger(startHour) ||
    !Number.isInteger(endHour) ||
    startHour < 0 ||
    endHour > 24 ||
    startHour >= endHour
  ) {
    throw new Error("hour range must be an integer range between 0 and 24");
  }
}

function toPublicSchedule(
  schedule: ScheduleWithParticipants | ScheduleWithParticipantCount,
): PublicSchedule {
  return {
    id: schedule.id,
    title: schedule.title,
    durationMinutes: schedule.durationMinutes,
    candidateDays: parseDayCodes(schedule.candidateDays),
    candidateStartHour: schedule.candidateStartHour,
    candidateEndHour: schedule.candidateEndHour,
    participantCount:
      "participants" in schedule
        ? schedule.participants.length
        : schedule._count.participants,
    status: schedule.status === "confirmed" ? "confirmed" : "open",
    confirmedSlot: parseOptionalTimeSlot(schedule.confirmedSlot),
    createdAt: schedule.createdAt.toISOString(),
    creatorId: schedule.creatorId,
  };
}

function toHostSchedule(schedule: ScheduleWithParticipants): HostSchedule {
  const participants = schedule.participants.map(toScheduleParticipant);
  const participantAvailability: ParticipantAvailability[] = participants.map(
    (participant) => ({
      userId: participant.id,
      available: participant.available,
    }),
  );

  return {
    ...toPublicSchedule(schedule),
    participants,
    commonSlots: findCommonSlots(participantAvailability),
  };
}

function toScheduleParticipant(participant: {
  id: string;
  name: string;
  available: string;
  submittedAt: Date;
  userId?: string | null;
}): ScheduleParticipant {
  return {
    id: participant.id,
    name: participant.name,
    available: parseTimeSlots(participant.available),
    submittedAt: participant.submittedAt.toISOString(),
    userId: participant.userId,
  };
}

function parseDayCodes(value: string): DayCode[] {
  const parsed = parseJson(value);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((day): day is DayCode =>
    VALID_DAYS.includes(day as DayCode),
  );
}

function parseTimeSlots(value: string): TimeSlot[] {
  const parsed = parseJson(value);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((slot): slot is TimeSlot => isTimeSlot(slot))
    .map((slot) => ({ ...slot }));
}

function parseOptionalTimeSlot(value: string | null): TimeSlot | undefined {
  if (!value) return undefined;
  const parsed = parseJson(value);
  return isTimeSlot(parsed) ? { ...parsed } : undefined;
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function isTimeSlot(value: unknown): value is TimeSlot {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const slot = value as Partial<TimeSlot>;
  return (
    typeof slot.day === "string" &&
    VALID_DAYS.includes(slot.day as DayCode) &&
    Number.isInteger(slot.startHour) &&
    Number.isInteger(slot.endHour)
  );
}

function createToken(byteLength: number): string {
  return randomBytes(byteLength).toString("base64url");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

function tokenMatches(expectedHash: string, receivedToken: string): boolean {
  const expectedBuffer = Buffer.from(expectedHash, "base64url");
  const receivedBuffer = Buffer.from(hashToken(receivedToken), "base64url");
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}
