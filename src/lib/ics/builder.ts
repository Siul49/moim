import { randomUUID } from "crypto";
import type { EventInput, BuiltEvent } from "@/types/icloud";

// ============================================================
// RFC 5545 ICS 빌더
// VCALENDAR + VEVENT 생성
// ============================================================

/** Date를 ICS UTC 형식(YYYYMMDDTHHmmssZ)으로 변환한다. */
function toIcsUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * ICS 텍스트 값 이스케이프.
 * RFC 5545: backslash, semicolon, comma, newline을 이스케이프한다.
 */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * 75바이트 초과 시 ICS line folding(CRLF + 공백)을 적용한다.
 * RFC 5545 §3.1 참고.
 */
function foldLine(line: string): string {
  const bytes = Buffer.byteLength(line, "utf8");
  if (bytes <= 75) return line;

  // 75 옥텟 단위로 자르기 (멀티바이트 문자 경계 고려)
  const parts: string[] = [];
  let remaining = line;
  let first = true;

  while (Buffer.byteLength(remaining, "utf8") > 75) {
    const limit = first ? 75 : 74; // 첫 줄 이후엔 앞에 공백 1자가 붙으므로 74
    let cut = limit;
    // 멀티바이트 문자 중간을 자르지 않도록 조정
    while (Buffer.byteLength(remaining.slice(0, cut), "utf8") > limit) cut--;
    parts.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut);
    first = false;
  }
  parts.push(remaining);

  return parts.join("\r\n ");
}

/**
 * EventInput으로부터 RFC 5545 ICS 문자열과 UID를 반환한다.
 *
 * 주의: 모든 시간은 UTC로 저장한다 (DTSTART:...Z 형식).
 * 입력 Date 객체는 이미 UTC 기준이어야 한다.
 */
export function buildIcs(input: EventInput): BuiltEvent {
  const uid = input.uid ?? `${randomUUID()}@moim.app`;
  const now = toIcsUtc(new Date());

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Moim//Moim CalDAV//KO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    foldLine(`UID:${uid}`),
    `DTSTAMP:${now}`,
    `DTSTART:${toIcsUtc(input.startAt)}`,
    `DTEND:${toIcsUtc(input.endAt)}`,
    foldLine(`SUMMARY:${escapeIcsText(input.title)}`),
  ];

  if (input.location) {
    lines.push(foldLine(`LOCATION:${escapeIcsText(input.location)}`));
  }
  if (input.description) {
    lines.push(foldLine(`DESCRIPTION:${escapeIcsText(input.description)}`));
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  // RFC 5545: 각 줄은 CRLF로 끝나야 한다
  const icsContent = lines.join("\r\n") + "\r\n";

  return { uid, icsContent };
}
