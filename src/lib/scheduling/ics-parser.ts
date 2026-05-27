import type { TimeSlot } from "@/types/schedule";
import { sortSlots } from "./time-slot";

/**
 * .ics 파일 텍스트에서 VEVENT의 DTSTART/DTEND를 busy TimeSlot 배열로 변환한다.
 *
 * 현재 MVP는 단일 VEVENT와 종일 이벤트를 지원한다. 반복 일정(RRULE)은 후속
 * 이슈에서 별도 확장한다.
 */
export function parseIcsToSlots(icsContent: string): TimeSlot[] {
  return sortSlots(
    extractEvents(icsContent)
      .map(eventToSlot)
      .filter((slot): slot is TimeSlot => Boolean(slot)),
  );
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

function eventToSlot(event: IcsEvent): TimeSlot | null {
  if (!event.start || !event.end) return null;

  const { start, end } = event;
  const startHour = start.isDateOnly ? 0 : start.date.getUTCHours();
  const endHour = getEndHour(start, end);

  if (startHour >= endHour) return null;

  return {
    day: toDayCode(start.date.getUTCDay()),
    startHour,
    endHour,
  };
}

function getEndHour(start: IcsDate, end: IcsDate): number {
  if (end.isDateOnly) return 24;

  const sameUtcDay =
    start.date.getUTCFullYear() === end.date.getUTCFullYear() &&
    start.date.getUTCMonth() === end.date.getUTCMonth() &&
    start.date.getUTCDate() === end.date.getUTCDate();

  return sameUtcDay ? end.date.getUTCHours() : 24;
}

function parseIcsDate(value: string): IcsDate | undefined {
  if (/^\d{8}$/.test(value)) {
    return {
      date: new Date(
        Date.UTC(
          Number(value.slice(0, 4)),
          Number(value.slice(4, 6)) - 1,
          Number(value.slice(6, 8)),
        ),
      ),
      isDateOnly: true,
    };
  }

  const match = value.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/,
  );
  if (!match) return undefined;

  const [, year, month, day, hour, minute, second] = match;
  return {
    date: new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
      ),
    ),
    isDateOnly: false,
  };
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
