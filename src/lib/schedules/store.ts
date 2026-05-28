import { createHash, randomBytes, timingSafeEqual } from "crypto";
import type { Prisma } from "@prisma/client";
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
}

export interface AddParticipantAvailabilityInput {
  name: string;
  available: TimeSlot[];
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
  createdAt: string;
}

export interface ScheduleParticipant {
  id: string;
  name: string;
  available: TimeSlot[];
  submittedAt: string;
}

export interface HostSchedule extends PublicSchedule {
  participants: ScheduleParticipant[];
  commonSlots: TimeSlot[];
}

type ScheduleWithParticipants = Prisma.ScheduleGetPayload<{
  include: { participants: true };
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
    include: { participants: true },
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

export async function addParticipantAvailability(
  scheduleId: string,
  input: AddParticipantAvailabilityInput,
): Promise<ScheduleParticipant> {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
  });
  if (!schedule) throw new Error("schedule not found");

  const participant = await prisma.scheduleParticipant.create({
    data: {
      id: createToken(12),
      scheduleId,
      name: normalizeParticipantName(input.name),
      available: JSON.stringify(
        normalizeAvailability(schedule, input.available),
      ),
    },
  });

  return toScheduleParticipant(participant);
}

export async function clearSchedules() {
  await prisma.scheduleParticipant.deleteMany();
  await prisma.schedule.deleteMany();
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

  return {
    title,
    durationMinutes: input.durationMinutes,
    candidateDays,
    candidateStartHour: input.candidateStartHour,
    candidateEndHour: input.candidateEndHour,
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

function toPublicSchedule(schedule: ScheduleWithParticipants): PublicSchedule {
  return {
    id: schedule.id,
    title: schedule.title,
    durationMinutes: schedule.durationMinutes,
    candidateDays: parseDayCodes(schedule.candidateDays),
    candidateStartHour: schedule.candidateStartHour,
    candidateEndHour: schedule.candidateEndHour,
    participantCount: schedule.participants.length,
    createdAt: schedule.createdAt.toISOString(),
  };
}

function toScheduleParticipant(participant: {
  id: string;
  name: string;
  available: string;
  submittedAt: Date;
}): ScheduleParticipant {
  return {
    id: participant.id,
    name: participant.name,
    available: parseTimeSlots(participant.available),
    submittedAt: participant.submittedAt.toISOString(),
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
