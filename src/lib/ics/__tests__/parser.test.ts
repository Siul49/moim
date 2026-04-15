import { describe, test, expect } from "vitest";
import { parseIcsToEvents, parseSingleIcs } from "../parser";

const BASIC_ICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:test-uid-1@moim.app
DTSTART:20260415T100000Z
DTEND:20260415T110000Z
SUMMARY:팀 미팅
LOCATION:회의실 A
DESCRIPTION:주간 회의
END:VEVENT
END:VCALENDAR`;

describe("parseIcsToEvents - 기본 파싱", () => {
  test("기본 VEVENT를 올바르게 파싱한다", () => {
    const events = parseIcsToEvents(BASIC_ICS);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      uid: "test-uid-1@moim.app",
      title: "팀 미팅",
      location: "회의실 A",
      description: "주간 회의",
      isAllDay: false,
    });
    expect(events[0].startAt).toEqual(new Date("2026-04-15T10:00:00Z"));
    expect(events[0].endAt).toEqual(new Date("2026-04-15T11:00:00Z"));
  });

  test("여러 VEVENT를 포함한 ICS를 파싱한다", () => {
    const multiIcs = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:event-1@moim.app
DTSTART:20260415T100000Z
DTEND:20260415T110000Z
SUMMARY:이벤트 1
END:VEVENT
BEGIN:VEVENT
UID:event-2@moim.app
DTSTART:20260416T140000Z
DTEND:20260416T150000Z
SUMMARY:이벤트 2
END:VEVENT
END:VCALENDAR`;

    const events = parseIcsToEvents(multiIcs);

    expect(events).toHaveLength(2);
    expect(events[0].uid).toBe("event-1@moim.app");
    expect(events[1].uid).toBe("event-2@moim.app");
  });

  test("LOCATION과 DESCRIPTION이 없는 이벤트를 파싱한다", () => {
    const minimalIcs = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:minimal@moim.app
DTSTART:20260415T100000Z
DTEND:20260415T110000Z
SUMMARY:최소 이벤트
END:VEVENT
END:VCALENDAR`;

    const events = parseIcsToEvents(minimalIcs);

    expect(events).toHaveLength(1);
    expect(events[0].location).toBeUndefined();
    expect(events[0].description).toBeUndefined();
  });

  test("DTEND가 없으면 1시간 후를 기본값으로 사용한다", () => {
    const noDtendIcs = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:no-end@moim.app
DTSTART:20260415T100000Z
SUMMARY:끝 시간 없음
END:VEVENT
END:VCALENDAR`;

    const events = parseIcsToEvents(noDtendIcs);

    expect(events[0].startAt).toEqual(new Date("2026-04-15T10:00:00Z"));
    expect(events[0].endAt).toEqual(new Date("2026-04-15T11:00:00Z"));
  });

  test("빈 문자열은 빈 배열을 반환한다", () => {
    expect(parseIcsToEvents("")).toEqual([]);
  });

  test("VEVENT가 없는 ICS는 빈 배열을 반환한다", () => {
    const noEvent = `BEGIN:VCALENDAR
VERSION:2.0
END:VCALENDAR`;
    expect(parseIcsToEvents(noEvent)).toEqual([]);
  });

  test("필수 필드(UID, SUMMARY, DTSTART)가 없으면 건너뛴다", () => {
    const incomplete = `BEGIN:VCALENDAR
BEGIN:VEVENT
DTSTART:20260415T100000Z
SUMMARY:UID 없음
END:VEVENT
BEGIN:VEVENT
UID:no-summary@test
DTSTART:20260415T100000Z
END:VEVENT
END:VCALENDAR`;

    const events = parseIcsToEvents(incomplete);
    expect(events).toHaveLength(0);
  });
});

describe("parseIcsToEvents - 종일 이벤트", () => {
  test("VALUE=DATE 형식의 종일 이벤트를 파싱한다", () => {
    const allDayIcs = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:allday@moim.app
DTSTART;VALUE=DATE:20260415
DTEND;VALUE=DATE:20260416
SUMMARY:종일 이벤트
END:VEVENT
END:VCALENDAR`;

    const events = parseIcsToEvents(allDayIcs);

    expect(events).toHaveLength(1);
    expect(events[0].isAllDay).toBe(true);
    expect(events[0].startAt).toEqual(new Date("2026-04-15T00:00:00Z"));
    expect(events[0].endAt).toEqual(new Date("2026-04-16T00:00:00Z"));
  });
});

describe("parseIcsToEvents - TZID 타임존", () => {
  test("TZID=Asia/Seoul 타임존을 UTC로 변환한다", () => {
    const tzIcs = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:tz-test@moim.app
DTSTART;TZID=Asia/Seoul:20260415T190000
DTEND;TZID=Asia/Seoul:20260415T200000
SUMMARY:서울 시간 이벤트
END:VEVENT
END:VCALENDAR`;

    const events = parseIcsToEvents(tzIcs);

    expect(events).toHaveLength(1);
    // Asia/Seoul = UTC+9 → 19:00 KST = 10:00 UTC
    expect(events[0].startAt).toEqual(new Date("2026-04-15T10:00:00Z"));
    expect(events[0].endAt).toEqual(new Date("2026-04-15T11:00:00Z"));
  });
});

describe("parseIcsToEvents - line unfolding", () => {
  test("CRLF+공백으로 접힌 줄을 펼친다", () => {
    const foldedIcs =
      "BEGIN:VCALENDAR\r\n" +
      "BEGIN:VEVENT\r\n" +
      "UID:fold-test@moim.app\r\n" +
      "DTSTART:20260415T100000Z\r\n" +
      "DTEND:20260415T110000Z\r\n" +
      "SUMMARY:접힌 제\r\n" +
      " 목 테스트\r\n" +
      "END:VEVENT\r\n" +
      "END:VCALENDAR\r\n";

    const events = parseIcsToEvents(foldedIcs);

    expect(events).toHaveLength(1);
    expect(events[0].title).toBe("접힌 제목 테스트");
  });
});

describe("parseIcsToEvents - 이스케이프 처리", () => {
  test("ICS 이스케이프 시퀀스를 올바르게 언이스케이프한다", () => {
    const escapedIcs = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:escape@moim.app
DTSTART:20260415T100000Z
DTEND:20260415T110000Z
SUMMARY:회의\\; 중요\\, 필수\\\\참석\\n필독
END:VEVENT
END:VCALENDAR`;

    const events = parseIcsToEvents(escapedIcs);

    expect(events[0].title).toBe("회의; 중요, 필수\\참석\n필독");
  });
});

describe("parseSingleIcs", () => {
  test("첫 번째 VEVENT만 반환한다", () => {
    const event = parseSingleIcs(BASIC_ICS);

    expect(event).not.toBeNull();
    expect(event!.uid).toBe("test-uid-1@moim.app");
  });

  test("VEVENT가 없으면 null을 반환한다", () => {
    expect(parseSingleIcs("")).toBeNull();
  });
});

describe("buildIcs → parseIcsToEvents 라운드트립", () => {
  test("빌드한 ICS를 파싱하면 원본 데이터가 복원된다", async () => {
    // builder는 별도 모듈이므로 동적 import
    const { buildIcs } = await import("../builder");

    const input = {
      title: "라운드트립 테스트",
      startAt: new Date("2026-04-15T10:00:00Z"),
      endAt: new Date("2026-04-15T11:30:00Z"),
      location: "서울 강남구",
      description: "빌더→파서 검증",
    };

    const { uid, icsContent } = buildIcs(input);
    const events = parseIcsToEvents(icsContent);

    expect(events).toHaveLength(1);
    expect(events[0].uid).toBe(uid);
    expect(events[0].title).toBe(input.title);
    expect(events[0].startAt).toEqual(input.startAt);
    expect(events[0].endAt).toEqual(input.endAt);
    expect(events[0].location).toBe(input.location);
    expect(events[0].description).toBe(input.description);
    expect(events[0].isAllDay).toBe(false);
  });
});
