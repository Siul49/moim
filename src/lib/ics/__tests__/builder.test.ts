import { describe, test, expect } from "vitest";
import { buildIcs } from "../builder";

describe("buildIcs - ICS 빌더", () => {
  const baseInput = {
    title: "팀 미팅",
    startAt: new Date("2026-04-15T10:00:00Z"),
    endAt: new Date("2026-04-15T11:00:00Z"),
  };

  test("유효한 VCALENDAR/VEVENT 구조를 생성한다", () => {
    const { icsContent } = buildIcs(baseInput);

    expect(icsContent).toContain("BEGIN:VCALENDAR");
    expect(icsContent).toContain("END:VCALENDAR");
    expect(icsContent).toContain("BEGIN:VEVENT");
    expect(icsContent).toContain("END:VEVENT");
    expect(icsContent).toContain("VERSION:2.0");
    expect(icsContent).toContain("PRODID:-//Moim//Moim CalDAV//KO");
  });

  test("UID를 지정하지 않으면 자동 생성한다 (@moim.app 접미사)", () => {
    const { uid, icsContent } = buildIcs(baseInput);

    expect(uid).toMatch(/@moim\.app$/);
    expect(icsContent).toContain(`UID:${uid}`);
  });

  test("UID를 지정하면 해당 UID를 사용한다", () => {
    const { uid, icsContent } = buildIcs({
      ...baseInput,
      uid: "custom-uid@test.com",
    });

    expect(uid).toBe("custom-uid@test.com");
    expect(icsContent).toContain("UID:custom-uid@test.com");
  });

  test("날짜를 ICS UTC 형식(YYYYMMDDTHHmmssZ)으로 변환한다", () => {
    const { icsContent } = buildIcs(baseInput);

    expect(icsContent).toContain("DTSTART:20260415T100000Z");
    expect(icsContent).toContain("DTEND:20260415T110000Z");
  });

  test("SUMMARY에 제목이 포함된다", () => {
    const { icsContent } = buildIcs(baseInput);

    expect(icsContent).toContain("SUMMARY:팀 미팅");
  });

  test("location이 있으면 LOCATION 속성을 추가한다", () => {
    const { icsContent } = buildIcs({
      ...baseInput,
      location: "회의실 A",
    });

    expect(icsContent).toContain("LOCATION:회의실 A");
  });

  test("description이 있으면 DESCRIPTION 속성을 추가한다", () => {
    const { icsContent } = buildIcs({
      ...baseInput,
      description: "주간 회의입니다",
    });

    expect(icsContent).toContain("DESCRIPTION:주간 회의입니다");
  });

  test("location과 description이 없으면 해당 속성을 생략한다", () => {
    const { icsContent } = buildIcs(baseInput);

    expect(icsContent).not.toContain("LOCATION:");
    expect(icsContent).not.toContain("DESCRIPTION:");
  });

  test("특수문자를 이스케이프한다 (세미콜론, 쉼표, 백슬래시, 개행)", () => {
    const { icsContent } = buildIcs({
      ...baseInput,
      title: "회의; 중요, 필수\\참석\n필독",
    });

    expect(icsContent).toContain("SUMMARY:회의\\; 중요\\, 필수\\\\참석\\n필독");
  });

  test("모든 줄이 CRLF로 끝난다", () => {
    const { icsContent } = buildIcs(baseInput);
    const lines = icsContent.split("\r\n");

    // 마지막은 빈 줄 (CRLF로 끝나므로 split 시 빈 문자열)
    expect(lines[lines.length - 1]).toBe("");
    // LF만 사용한 줄이 없어야 한다
    expect(icsContent.replace(/\r\n/g, "")).not.toContain("\n");
  });
});

describe("buildIcs - line folding", () => {
  test("75바이트 이하인 줄은 접히지 않는다", () => {
    const { icsContent } = buildIcs({
      ...{
        title: "Short",
        startAt: new Date("2026-04-15T10:00:00Z"),
        endAt: new Date("2026-04-15T11:00:00Z"),
      },
    });

    // SUMMARY:Short는 75바이트 이하 → 접히지 않아야 함
    expect(icsContent).toContain("SUMMARY:Short");
  });

  test("75바이트를 초과하는 줄은 CRLF+공백으로 접힌다", () => {
    const longTitle = "A".repeat(100);
    const { icsContent } = buildIcs({
      title: longTitle,
      startAt: new Date("2026-04-15T10:00:00Z"),
      endAt: new Date("2026-04-15T11:00:00Z"),
    });

    // SUMMARY:AAA... 는 108바이트 → 접혀야 함
    const summaryLine = icsContent
      .split("\r\n")
      .find((l) => l.startsWith("SUMMARY:"));
    expect(summaryLine).toBeDefined();
    // 접힌 줄의 연속행이 있어야 함
    const idx = icsContent.indexOf("SUMMARY:");
    const afterSummary = icsContent.slice(idx);
    expect(afterSummary).toContain("\r\n ");
  });
});
