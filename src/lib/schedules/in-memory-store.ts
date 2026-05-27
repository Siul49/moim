import { randomBytes, timingSafeEqual } from "crypto";
import type {
  DayCode,
  ParticipantAvailability,
  TimeSlot,
} from "@/types/schedule";
import { findCommonSlots } from "@/lib/scheduling/availability";
import { mergeOverlapping, sortSlots } from "@/lib/scheduling/time-slot";

export interface CreateInMemoryScheduleInput {
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

export interface CreatedInMemorySchedule {
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

interface ScheduleRecord {
  id: string;
  hostToken: string;
  title: string;
  durationMinutes: number;
  candidateDays: DayCode[];
  candidateStartHour: number;
  candidateEndHour: number;
  participants: ScheduleParticipant[];
  createdAt: string;
}

interface ScheduleStore {
  schedules: Map<string, ScheduleRecord>;
}

const STORE_KEY = "__moimInMemoryScheduleStore";
const VALID_DAYS: DayCode[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export function createSchedule(
  input: CreateInMemoryScheduleInput,
): CreatedInMemorySchedule {
  const schedule = normalizeScheduleInput(input);
  const id = createToken(18);
  const hostToken = createToken(32);

  getStore().schedules.set(id, {
    ...schedule,
    id,
    hostToken,
    participants: [],
    createdAt: new Date().toISOString(),
  });

  return { id, hostToken };
}

export function getSchedulePublic(id: string): PublicSchedule | null {
  const schedule = getStore().schedules.get(id);
  if (!schedule) return null;
  return toPublicSchedule(schedule);
}

export function getScheduleForHost(
  id: string,
  hostToken: string,
): HostSchedule | null {
  const schedule = getStore().schedules.get(id);
  if (!schedule || !tokenMatches(schedule.hostToken, hostToken)) return null;

  const participantAvailability: ParticipantAvailability[] =
    schedule.participants.map((participant) => ({
      userId: participant.id,
      available: participant.available,
    }));

  return {
    ...toPublicSchedule(schedule),
    participants: schedule.participants.map(copyParticipant),
    commonSlots: findCommonSlots(participantAvailability),
  };
}

export function addParticipantAvailability(
  scheduleId: string,
  input: AddParticipantAvailabilityInput,
): ScheduleParticipant {
  const schedule = getStore().schedules.get(scheduleId);
  if (!schedule) throw new Error("schedule not found");

  const participant: ScheduleParticipant = {
    id: createToken(12),
    name: normalizeParticipantName(input.name),
    available: normalizeAvailability(schedule, input.available),
    submittedAt: new Date().toISOString(),
  };

  schedule.participants.push(participant);
  return copyParticipant(participant);
}

export function clearSchedules() {
  getStore().schedules.clear();
}

function getStore(): ScheduleStore {
  const globalStore = globalThis as typeof globalThis & {
    [STORE_KEY]?: ScheduleStore;
  };

  if (!globalStore[STORE_KEY]) {
    globalStore[STORE_KEY] = { schedules: new Map() };
  }

  return globalStore[STORE_KEY];
}

function normalizeScheduleInput(
  input: CreateInMemoryScheduleInput,
): Omit<ScheduleRecord, "id" | "hostToken" | "participants" | "createdAt"> {
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
  schedule: ScheduleRecord,
  available: TimeSlot[],
): TimeSlot[] {
  if (available.length === 0) {
    throw new Error("availability must not be empty");
  }

  for (const slot of available) {
    validateHourRange(slot.startHour, slot.endHour);
    if (
      !schedule.candidateDays.includes(slot.day) ||
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

function toPublicSchedule(schedule: ScheduleRecord): PublicSchedule {
  return {
    id: schedule.id,
    title: schedule.title,
    durationMinutes: schedule.durationMinutes,
    candidateDays: [...schedule.candidateDays],
    candidateStartHour: schedule.candidateStartHour,
    candidateEndHour: schedule.candidateEndHour,
    participantCount: schedule.participants.length,
    createdAt: schedule.createdAt,
  };
}

function copyParticipant(
  participant: ScheduleParticipant,
): ScheduleParticipant {
  return {
    ...participant,
    available: participant.available.map((slot) => ({ ...slot })),
  };
}

function createToken(byteLength: number): string {
  return randomBytes(byteLength).toString("base64url");
}

function tokenMatches(expected: string, received: string): boolean {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}
