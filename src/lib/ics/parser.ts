import type { ParsedEvent } from "@/types/icloud";

// ============================================================
// 외부 의존성 없는 ICS 파서
// RFC 5545 핵심 필드(UID, SUMMARY, DTSTART, DTEND,
// LOCATION, DESCRIPTION)를 파싱한다.
// ============================================================

/** ICS의 "line folding"을 풀어준다 (연속행 합치기). */
function unfoldLines(ics: string): string {
  return ics.replace(/\r?\n[ \t]/g, "");
}

/**
 * ICS 날짜/시간 문자열을 JavaScript Date로 변환한다.
 *
 * 지원 형식:
 *   20260414T100000Z       → UTC 시간
 *   20260414T100000        → TZID 파라미터 없이 로컬 시간(UTC로 취급)
 *   20260414               → 종일 이벤트
 *   TZID=Asia/Seoul:20260414T100000  → 타임존 오프셋 적용
 */
function parseIcsDate(
  value: string,
  params: string,
): { date: Date; isAllDay: boolean } {
  // VALUE=DATE → 종일 이벤트
  if (params.includes("VALUE=DATE") || /^\d{8}$/.test(value)) {
    const [year, month, day] = [
      parseInt(value.slice(0, 4)),
      parseInt(value.slice(4, 6)) - 1,
      parseInt(value.slice(6, 8)),
    ];
    return { date: new Date(Date.UTC(year, month, day)), isAllDay: true };
  }

  // UTC 시간 (Z suffix)
  if (value.endsWith("Z")) {
    const iso = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:${value.slice(13, 15)}Z`;
    return { date: new Date(iso), isAllDay: false };
  }

  // TZID 파라미터가 있는 경우
  const tzidMatch = params.match(/TZID=([^;:]+)/);
  if (tzidMatch) {
    const tzid = tzidMatch[1];
    const iso = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:${value.slice(13, 15)}`;
    try {
      // iso 문자열을 UTC 기준으로 파싱한 뒤 타임존 오프셋을 적용
      const tempDate = new Date(iso + "Z");
      const utcDate = convertTzToUtc(tempDate, tzid);
      return { date: utcDate, isAllDay: false };
    } catch {
      // 타임존 변환 실패 시 UTC로 취급
      return { date: new Date(iso + "Z"), isAllDay: false };
    }
  }

  // 타임존 정보 없는 로컬 시간 (UTC로 취급)
  const iso = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:${value.slice(13, 15)}Z`;
  return { date: new Date(iso), isAllDay: false };
}

/**
 * TZID 타임존의 로컬 시간을 UTC Date로 변환한다.
 * Node.js 22+의 Intl.DateTimeFormat + timeZone 옵션을 활용한다.
 */
function convertTzToUtc(localDate: Date, tzid: string): Date {
  // "2026-04-14T10:00:00" 형태의 문자열을 TZID 타임존으로 해석해 UTC 변환
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tzid,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "shortOffset",
  });
  const parts = fmt.formatToParts(localDate);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "0";

  // timeZoneName에서 UTC 오프셋 추출 (예: "GMT+9" → +540분)
  const tzName = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  const offsetMatch = tzName.match(/GMT([+-])(\d+)(?::(\d+))?/);
  if (!offsetMatch) return localDate;

  const sign = offsetMatch[1] === "+" ? 1 : -1;
  const offsetMs =
    sign *
    (parseInt(get("hour")) * 3600_000 - // 실제로는 오프셋만 필요
      0); // 복잡하므로 아래 단순 계산으로 대체
  void offsetMs;

  const offsetHours = parseInt(offsetMatch[2]);
  const offsetMinutes = parseInt(offsetMatch[3] ?? "0");
  const totalOffsetMs = sign * (offsetHours * 60 + offsetMinutes) * 60_000;

  return new Date(localDate.getTime() - totalOffsetMs);
}

/** ICS 텍스트 값에서 이스케이프를 제거한다. */
function unescapeIcsText(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\;/g, ";")
    .replace(/\\,/g, ",")
    .replace(/\\\\/g, "\\");
}

/**
 * ICS 문자열에서 VEVENT 블록을 파싱해 ParsedEvent 배열을 반환한다.
 * 하나의 ICS 파일에 여러 VEVENT가 포함될 수 있다.
 */
export function parseIcsToEvents(icsText: string): ParsedEvent[] {
  const unfolded = unfoldLines(icsText);
  const lines = unfolded.split(/\r?\n/);

  const events: ParsedEvent[] = [];
  let inVEvent = false;
  let props: Record<string, { value: string; params: string }> = {};

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inVEvent = true;
      props = {};
      continue;
    }

    if (line === "END:VEVENT") {
      inVEvent = false;
      const event = buildEvent(props);
      if (event) events.push(event);
      continue;
    }

    if (!inVEvent) continue;

    // "PROPERTY;PARAM=VAL:value" 형태 파싱
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const keyPart = line.slice(0, colonIdx);
    const value = line.slice(colonIdx + 1);
    const semicolonIdx = keyPart.indexOf(";");

    const key = semicolonIdx === -1 ? keyPart : keyPart.slice(0, semicolonIdx);
    const params = semicolonIdx === -1 ? "" : keyPart.slice(semicolonIdx);

    // 같은 프로퍼티가 여러 번 나오면 첫 번째만 사용
    if (!(key in props)) {
      props[key] = { value, params };
    }
  }

  return events;
}

/** props 맵으로부터 ParsedEvent를 빌드한다. */
function buildEvent(
  props: Record<string, { value: string; params: string }>,
): ParsedEvent | null {
  const uid = props["UID"]?.value;
  const summaryRaw = props["SUMMARY"]?.value;
  const dtStartProp = props["DTSTART"];
  const dtEndProp = props["DTEND"];

  if (!uid || !summaryRaw || !dtStartProp) return null;

  const { date: startAt, isAllDay } = parseIcsDate(
    dtStartProp.value,
    dtStartProp.params,
  );
  const { date: endAt } = dtEndProp
    ? parseIcsDate(dtEndProp.value, dtEndProp.params)
    : { date: new Date(startAt.getTime() + 3_600_000) }; // DTEND 없으면 1시간 후

  return {
    uid,
    title: unescapeIcsText(summaryRaw),
    startAt,
    endAt,
    isAllDay,
    location: props["LOCATION"]
      ? unescapeIcsText(props["LOCATION"].value)
      : undefined,
    description: props["DESCRIPTION"]
      ? unescapeIcsText(props["DESCRIPTION"].value)
      : undefined,
  };
}

/** 단일 VEVENT 파싱 (CalDAV REPORT 응답의 개별 이벤트용). */
export function parseSingleIcs(icsText: string): ParsedEvent | null {
  return parseIcsToEvents(icsText)[0] ?? null;
}
