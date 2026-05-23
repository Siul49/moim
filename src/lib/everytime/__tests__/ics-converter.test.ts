import { describe, expect, it } from "vitest";
import { parseTimetableFromIcs } from "../ics-converter";

// Asia/Seoul UTC+9 기준 ICS 샘플 (에브리타임 내보내기 형식)
const SAMPLE_ICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Everytime//Timetable//EN
BEGIN:VEVENT
UID:ds-mon@everytime
SUMMARY:데이터구조
DTSTART;TZID=Asia/Seoul:20250303T090000
DTEND;TZID=Asia/Seoul:20250303T103000
RRULE:FREQ=WEEKLY;UNTIL=20250620T145900Z
LOCATION:공학관 301
END:VEVENT
BEGIN:VEVENT
UID:ds-wed@everytime
SUMMARY:데이터구조
DTSTART;TZID=Asia/Seoul:20250305T090000
DTEND;TZID=Asia/Seoul:20250305T103000
RRULE:FREQ=WEEKLY;UNTIL=20250620T145900Z
LOCATION:공학관 301
END:VEVENT
BEGIN:VEVENT
UID:algo-tue@everytime
SUMMARY:알고리즘
DTSTART;TZID=Asia/Seoul:20250304T130000
DTEND;TZID=Asia/Seoul:20250304T143000
RRULE:FREQ=WEEKLY;UNTIL=20250620T145900Z
LOCATION:공학관 201
END:VEVENT
END:VCALENDAR`;

describe("parseTimetableFromIcs", () => {
  it("같은 과목명의 여러 시간대를 하나의 lecture로 병합한다", () => {
    const timetable = parseTimetableFromIcs(SAMPLE_ICS);
    const ds = timetable.lectures.find((l) => l.name === "데이터구조");

    expect(ds).toBeDefined();
    expect(ds!.times).toHaveLength(2);
  });

  it("요일을 월요일 기준(0=월)으로 정확히 변환한다", () => {
    const timetable = parseTimetableFromIcs(SAMPLE_ICS);
    const ds = timetable.lectures.find((l) => l.name === "데이터구조")!;

    const days = ds.times.map((t) => t.day).sort();
    // 2025-03-03=월(0), 2025-03-05=수(2)
    expect(days).toEqual([0, 2]);
  });

  it("시작/종료 시각을 분 단위로 정확히 변환한다", () => {
    const timetable = parseTimetableFromIcs(SAMPLE_ICS);
    const ds = timetable.lectures.find((l) => l.name === "데이터구조")!;
    const mon = ds.times.find((t) => t.day === 0)!;

    // 09:00 → 540분, 10:30 → 630분
    expect(mon.startMinute).toBe(540);
    expect(mon.endMinute).toBe(630);
  });

  it("여러 과목을 각각 별도 lecture로 반환한다", () => {
    const timetable = parseTimetableFromIcs(SAMPLE_ICS);
    expect(timetable.lectures).toHaveLength(2);

    const names = timetable.lectures.map((l) => l.name);
    expect(names).toContain("데이터구조");
    expect(names).toContain("알고리즘");
  });

  it("동일한 (과목, 요일, 시작분) 조합이 중복 포함되지 않는다", () => {
    // 에브리타임이 RRULE 없이 매주 개별 VEVENT로 내보내는 경우 시뮬레이션
    const icsWithDuplicates = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:ds-mon-week1@everytime
SUMMARY:데이터구조
DTSTART;TZID=Asia/Seoul:20250303T090000
DTEND;TZID=Asia/Seoul:20250303T103000
END:VEVENT
BEGIN:VEVENT
UID:ds-mon-week2@everytime
SUMMARY:데이터구조
DTSTART;TZID=Asia/Seoul:20250310T090000
DTEND;TZID=Asia/Seoul:20250310T103000
END:VEVENT
END:VCALENDAR`;

    const timetable = parseTimetableFromIcs(icsWithDuplicates);
    const ds = timetable.lectures.find((l) => l.name === "데이터구조")!;
    // 같은 요일·시작분이므로 1개만 남아야 함
    expect(ds.times).toHaveLength(1);
  });

  it("종일 이벤트는 무시한다", () => {
    const icsWithAllDay = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:holiday@test
SUMMARY:공휴일
DTSTART;VALUE=DATE:20250303
DTEND;VALUE=DATE:20250304
END:VEVENT
BEGIN:VEVENT
UID:class@test
SUMMARY:수학
DTSTART;TZID=Asia/Seoul:20250303T100000
DTEND;TZID=Asia/Seoul:20250303T120000
END:VEVENT
END:VCALENDAR`;

    const timetable = parseTimetableFromIcs(icsWithAllDay);
    expect(timetable.lectures).toHaveLength(1);
    expect(timetable.lectures[0].name).toBe("수학");
  });

  it("빈 ICS는 빈 timetable을 반환한다", () => {
    const timetable = parseTimetableFromIcs("BEGIN:VCALENDAR\nEND:VCALENDAR");
    expect(timetable.lectures).toEqual([]);
  });

  it("빈 과목명(SUMMARY)은 무시된다", () => {
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:empty@test
SUMMARY:
DTSTART;TZID=Asia/Seoul:20250303T090000
DTEND;TZID=Asia/Seoul:20250303T103000
END:VEVENT
END:VCALENDAR`;
    const timetable = parseTimetableFromIcs(ics);
    expect(timetable.lectures).toHaveLength(0);
  });

  it("DTSTART >= DTEND인 이벤트는 무시된다", () => {
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:invalid@test
SUMMARY:역순수업
DTSTART;TZID=Asia/Seoul:20250303T103000
DTEND;TZID=Asia/Seoul:20250303T090000
END:VEVENT
END:VCALENDAR`;
    const timetable = parseTimetableFromIcs(ics);
    expect(timetable.lectures).toHaveLength(0);
  });

  it("비정상적인 시간 범위(시간 범위를 벗어남 등)는 무시한다", () => {
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:outofbounds@test
SUMMARY:자정넘김수업
DTSTART;TZID=Asia/Seoul:20250303T230000
DTEND;TZID=Asia/Seoul:20250304T010000
END:VEVENT
END:VCALENDAR`;
    const timetable = parseTimetableFromIcs(ics);
    expect(timetable.lectures).toHaveLength(0);
  });
});
