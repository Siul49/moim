import { describe, expect, test } from "vitest";
import { parseIcsToSlots } from "../ics-parser";

describe("parseIcsToSlots", () => {
  test("converts UTC VEVENT DTSTART and DTEND into a weekday time slot", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART:20260504T090000Z",
      "DTEND:20260504T110000Z",
      "SUMMARY:team meeting",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    expect(parseIcsToSlots(ics)).toEqual([
      { day: "MON", startHour: 9, endHour: 11 },
    ]);
  });

  test("returns multiple VEVENT slots sorted by time", () => {
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

  test("converts date-only VEVENT into a full-day busy slot", () => {
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

  test("returns an empty array for empty ICS or calendars without VEVENT", () => {
    expect(parseIcsToSlots("")).toEqual([]);
    expect(parseIcsToSlots("BEGIN:VCALENDAR\nEND:VCALENDAR")).toEqual([]);
  });

  test("ignores VEVENT entries without a valid DTSTART", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTEND:20260504T110000Z",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "DTSTART:not-a-date",
      "DTEND:20260504T110000Z",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n");

    expect(parseIcsToSlots(ics)).toEqual([]);
  });

  test("ignores floating datetime values without UTC suffix", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART:20260504T090000",
      "DTEND:20260504T110000",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n");

    expect(parseIcsToSlots(ics)).toEqual([]);
  });

  test("ignores zero-length events", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART:20260504T090000Z",
      "DTEND:20260504T090000Z",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n");

    expect(parseIcsToSlots(ics)).toEqual([]);
  });

  test("handles folded lines", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART:20260504T000000Z",
      "DTEND:20260504T020000Z",
      "SUMMARY:folded",
      " title",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    expect(parseIcsToSlots(ics)).toEqual([
      { day: "MON", startHour: 0, endHour: 2 },
    ]);
  });

  test("cross-midnight VEVENT is split into daily busy slots", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART:20260504T220000Z",
      "DTEND:20260505T020000Z",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n");

    expect(parseIcsToSlots(ics)).toEqual([
      { day: "MON", startHour: 22, endHour: 24 },
      { day: "TUE", startHour: 0, endHour: 2 },
    ]);
  });

  test("rejects normalized invalid ICS dates", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "DTSTART:20260230T090000Z",
      "DTEND:20260230T110000Z",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "DTSTART:20260504T250000Z",
      "DTEND:20260504T260000Z",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\n");

    expect(parseIcsToSlots(ics)).toEqual([]);
  });
});
