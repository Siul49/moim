import type { TimeSlot } from "@/types/schedule";
import { sortSlots } from "./time-slot";

/**
 * .ics 파일 텍스트에서 VEVENT의 DTSTART/DTEND를 busy TimeSlot 배열로 변환한다.
 *
 * 현재 MVP는 단일 VEVENT와 종일 이벤트를 지원한다. 반복 일정(RRULE)은 후속
 * 이슈에서 별도 확장한다.
 */
export function parseIcsToSlots(icsContent: string): TimeSlot[] {
  return sortSlots(extractEvents(icsContent).flatMap(eventToSlots));
}

interface IcsEvent {
  start?: IcsDate;
  end?: IcsDate;
}

interface IcsDate {
  date: Date;
  isDateOnly: boolean;
}

function extractEvents(icsContent: string): IcsEvent[] {
  const lines = unfoldLines(icsContent);
  const events: IcsEvent[] = [];
  let current: IcsEvent | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }

    if (line === "END:VEVENT") {
      if (current) events.push(current);
      current = null;
      continue;
    }

    if (!current) continue;

    const separatorIndex = line.indexOf(":");
    if (separatorIndex < 0) continue;

    const key = line.slice(0, separatorIndex).split(";")[0];
    const value = line.slice(separatorIndex + 1);

    if (key === "DTSTART") current.start = parseIcsDate(value);
    if (key === "DTEND") current.end = parseIcsDate(value);
  }

  return events;
}

function unfoldLines(icsContent: string): string[] {
  return icsContent
    .replace(/\r?\n[ \t]/g, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function eventToSlots(event: IcsEvent): TimeSlot[] {
  if (!event.start || !event.end) return [];

  const { start, end } = event;
  if (end.date <= start.date) return [];

  const slots: TimeSlot[] = [];
  let currentDay = startOfUtcDay(start.date);
  const finalDay = startOfUtcDay(end.date);

  while (currentDay <= finalDay) {
    const isFirstDay = isSameUtcDay(currentDay, start.date);
    const isLastDay = isSameUtcDay(currentDay, end.date);
    const startHour =
      isFirstDay && !start.isDateOnly ? start.date.getUTCHours() : 0;
    const endHour = isLastDay
      ? end.isDateOnly
        ? 0
        : end.date.getUTCHours()
      : 24;

    if (startHour < endHour) {
      slots.push({
        day: toDayCode(currentDay.getUTCDay()),
        startHour,
        endHour,
      });
    }

    currentDay = addUtcDays(currentDay, 1);
  }

  return slots;
}

function parseIcsDate(value: string): IcsDate | undefined {
  if (/^\d{8}$/.test(value)) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6));
    const day = Number(value.slice(6, 8));
    const date = createUtcDate(year, month, day);
    if (!date) return undefined;

    return {
      date,
      isDateOnly: true,
    };
  }

  const match = value.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/,
  );
  if (!match) return undefined;

  const [, year, month, day, hour, minute, second, utcSuffix] = match;
  if (!utcSuffix) return undefined;
  const date = createUtcDate(
    Number(year),
    Number(month),
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
  if (!date) return undefined;

  return {
    date,
    isDateOnly: false,
  };
}

function createUtcDate(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): Date | undefined {
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !== hour ||
    date.getUTCMinutes() !== minute ||
    date.getUTCSeconds() !== second
  ) {
    return undefined;
  }
  return date;
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function isSameUtcDay(left: Date, right: Date): boolean {
  return (
    left.getUTCFullYear() === right.getUTCFullYear() &&
    left.getUTCMonth() === right.getUTCMonth() &&
    left.getUTCDate() === right.getUTCDate()
  );
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + days,
    ),
  );
}

function toDayCode(day: number): TimeSlot["day"] {
  const days: TimeSlot["day"][] = [
    "SUN",
    "MON",
    "TUE",
    "WED",
    "THU",
    "FRI",
    "SAT",
  ];
  return days[day];
}
