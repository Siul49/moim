import { describe, expect, test } from "vitest";
import { parseIcsToSlots } from "../ics-parser";

describe("parseIcsToSlots", () => {
  test("UTC VEVENT의 DTSTART/DTEND를 요일 시간 슬롯으로 변환한다", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART:20260504T090000Z",
      "DTEND:20260504T110000Z",
      "SUMMARY:팀 회의",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    expect(parseIcsToSlots(ics)).toEqual([
      { day: "MON", startHour: 9, endHour: 11 },
    ]);
  });

  test("여러 VEVENT를 시간 순서대로 반환한다", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART:20260506T140000Z",
      "DTEND:20260506T150000Z",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "DTSTART:20260504T100000Z",
      "DTEND:20260504T120000Z",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n");

    expect(parseIcsToSlots(ics)).toEqual([
      { day: "MON", startHour: 10, endHour: 12 },
      { day: "WED", startHour: 14, endHour: 15 },
    ]);
  });

  test("종일 이벤트는 해당 요일 전체 busy 슬롯으로 변환한다", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART;VALUE=DATE:20260508",
      "DTEND;VALUE=DATE:20260509",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n");

    expect(parseIcsToSlots(ics)).toEqual([
      { day: "FRI", startHour: 0, endHour: 24 },
    ]);
  });
});
