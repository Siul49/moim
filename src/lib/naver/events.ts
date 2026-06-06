import { randomUUID } from "crypto";
import type {
  NaverCreateScheduleResponse,
  NaverEvent,
  NaverEventInput,
} from "@/types/naver-calendar";

const NAVER_CALENDAR_CREATE_URL =
  "https://openapi.naver.com/calendar/createSchedule.json";
const DEFAULT_CALENDAR_ID = "defaultCalendarId";
const DEFAULT_TIME_ZONE = "Asia/Seoul";

function getClientId(): string {
  const id = process.env.NAVER_CLIENT_ID;
  if (!id) throw new Error("NAVER_CLIENT_ID 환경변수가 설정되지 않았습니다.");
  return id;
}

function getClientSecret(): string {
  const secret = process.env.NAVER_CLIENT_SECRET;
  if (!secret)
    throw new Error("NAVER_CLIENT_SECRET 환경변수가 설정되지 않았습니다.");
  return secret;
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function toNaverLocalDateTime(value: string, timeZone: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("날짜 형식이 올바르지 않습니다.");
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}${byType.month}${byType.day}T${byType.hour}${byType.minute}${byType.second}`;
}

function toIcsUtc(date = new Date()): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/** Naver createSchedule API에 전달할 iCalendar 문자열을 만든다. */
export function buildNaverScheduleIcal(input: NaverEventInput): string {
  const timeZone = input.timeZone ?? DEFAULT_TIME_ZONE;
  const uid = input.uid ?? `${randomUUID()}@moim.app`;
  const now = toIcsUtc();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:Naver Calendar",
    "CALSCALE:GREGORIAN",
    "BEGIN:VTIMEZONE",
    `TZID:${timeZone}`,
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZNAME:GMT+09:00",
    "TZOFFSETFROM:+0900",
    "TZOFFSETTO:+0900",
    "END:STANDARD",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    "SEQUENCE:0",
    "CLASS:PUBLIC",
    "TRANSP:OPAQUE",
    `UID:${uid}`,
    `DTSTART;TZID=${timeZone}:${toNaverLocalDateTime(input.startDateTime, timeZone)}`,
    `DTEND;TZID=${timeZone}:${toNaverLocalDateTime(input.endDateTime, timeZone)}`,
    `SUMMARY:${escapeIcsText(input.summary)}`,
  ];

  if (input.description) {
    lines.push(`DESCRIPTION:${escapeIcsText(input.description)}`);
  }
  if (input.location) {
    lines.push(`LOCATION:${escapeIcsText(input.location)}`);
  }

  lines.push(
    `CREATED:${now}`,
    `LAST-MODIFIED:${now}`,
    `DTSTAMP:${now}`,
    "END:VEVENT",
    "END:VCALENDAR",
  );

  return lines.join("\n");
}

/** 네이버 캘린더에 새 일정을 생성한다. */
export async function createEvent(
  accessToken: string,
  input: NaverEventInput,
): Promise<NaverEvent> {
  const body = new URLSearchParams({
    calendarId: input.calendarId ?? DEFAULT_CALENDAR_ID,
    scheduleIcalString: buildNaverScheduleIcal(input),
  });

  const response = await fetch(NAVER_CALENDAR_CREATE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Naver-Client-Id": getClientId(),
      "X-Naver-Client-Secret": getClientSecret(),
    },
    body,
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 401) {
      throw new Error(
        `Naver Calendar API 인증 실패 (${response.status}): ${error}`,
      );
    }
    if (response.status === 403) {
      throw new Error(
        `Naver Calendar API 권한이 없습니다 (${response.status}): ${error}`,
      );
    }
    throw new Error(`일정 생성 실패 (${response.status}): ${error}`);
  }

  const data = (await response.json()) as NaverCreateScheduleResponse;
  if (data.result !== "success" || !data.returnValue) {
    throw new Error(data.message ?? "Naver 일정 생성 결과가 올바르지 않습니다.");
  }

  return data.returnValue;
}
