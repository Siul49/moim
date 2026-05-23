import { describe, expect, it } from "vitest";
import { EverytimeScrapeError, parseShareResponse } from "../url-scraper";

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <table year="2026" semester="1" status="1" identifier="ApzpTKABRIpU6duu9LoH">
    <subject id="1">
      <name value="오픈소스를활용한실전창업"/>
      <professor value="김종배"/>
      <time value="월 09:00-11:45">
        <data day="0" starttime="108" endtime="141" place="미래관 20501"/>
      </time>
    </subject>
    <subject id="2">
      <name value="프로그래밍언어"/>
      <professor value="양승민"/>
      <time value="수 금 12:00-13:15">
        <data day="2" starttime="144" endtime="159" place="정보과학관"/>
        <data day="4" starttime="144" endtime="159" place="정보과학관"/>
      </time>
    </subject>
  </table>
</response>`;

describe("parseShareResponse", () => {
  it("XML에서 과목 목록을 파싱한다", () => {
    const timetable = parseShareResponse(SAMPLE_XML);
    expect(timetable.lectures).toHaveLength(2);
  });

  it("과목명을 정확히 파싱한다", () => {
    const timetable = parseShareResponse(SAMPLE_XML);
    const names = timetable.lectures.map((l) => l.name);
    expect(names).toContain("오픈소스를활용한실전창업");
    expect(names).toContain("프로그래밍언어");
  });

  it("starttime × 5 = 자정 기준 분으로 변환한다", () => {
    const timetable = parseShareResponse(SAMPLE_XML);
    const open = timetable.lectures.find(
      (l) => l.name === "오픈소스를활용한실전창업",
    )!;
    // starttime=108 → 108×5=540분 = 09:00
    // endtime=141 → 141×5=705분 = 11:45
    expect(open.times[0].startMinute).toBe(540);
    expect(open.times[0].endMinute).toBe(705);
  });

  it("요일(day)을 그대로 반환한다 (0=월)", () => {
    const timetable = parseShareResponse(SAMPLE_XML);
    const open = timetable.lectures.find(
      (l) => l.name === "오픈소스를활용한실전창업",
    )!;
    expect(open.times[0].day).toBe(0);
  });

  it("여러 요일 수업을 각각 times 항목으로 반환한다", () => {
    const timetable = parseShareResponse(SAMPLE_XML);
    const prog = timetable.lectures.find((l) => l.name === "프로그래밍언어")!;
    expect(prog.times).toHaveLength(2);
    const days = prog.times.map((t) => t.day).sort();
    expect(days).toEqual([2, 4]); // 수=2, 금=4
  });

  it("table이 없으면 EverytimeScrapeError를 throw한다", () => {
    const xml = `<?xml version="1.0"?><response></response>`;
    expect(() => parseShareResponse(xml)).toThrow(EverytimeScrapeError);
  });

  it("비정상적인 시간 데이터(day 범위 초과, 정수가 아님, 범위 오류 등)는 무시한다", () => {
    const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <table year="2026" semester="1" status="1" identifier="ApzpTKABRIpU6duu9LoH">
    <subject id="1">
      <name value="비정상과목1"/>
      <time value="월 09:00-11:45">
        <!-- day가 7 (범위 초과) -->
        <data day="7" starttime="108" endtime="141" place="미래관"/>
      </time>
    </subject>
    <subject id="2">
      <name value="비정상과목2"/>
      <time value="월 09:00-11:45">
        <!-- starttime이 endtime보다 큼 -->
        <data day="0" starttime="141" endtime="108" place="미래관"/>
      </time>
    </subject>
    <subject id="3">
      <name value="비정상과목3"/>
      <time value="월 09:00-11:45">
        <!-- 정수가 아님 -->
        <data day="0" starttime="10.5" endtime="141" place="미래관"/>
      </time>
    </subject>
  </table>
</response>`;
    const timetable = parseShareResponse(invalidXml);
    expect(timetable.lectures).toHaveLength(0);
  });

  it("빈 시간표(subject 없음)를 처리한다", () => {
    const xml = `<?xml version="1.0"?>
<response>
  <table year="2026" semester="1" status="1" identifier="test">
  </table>
</response>`;
    const timetable = parseShareResponse(xml);
    expect(timetable.lectures).toHaveLength(0);
  });

  it("음수 starttime은 필터링된다", () => {
    const xml = `<?xml version="1.0"?>
<response>
  <table year="2026" semester="1" status="1" identifier="test">
    <subject id="1">
      <name value="테스트"/>
      <time value="월">
        <data day="0" starttime="-10" endtime="141" place=""/>
      </time>
    </subject>
  </table>
</response>`;
    const timetable = parseShareResponse(xml);
    expect(timetable.lectures).toHaveLength(0);
  });

  it("day가 0-6 범위를 벗어나면 필터링된다", () => {
    const xml = `<?xml version="1.0"?>
<response>
  <table year="2026" semester="1" status="1" identifier="test">
    <subject id="1">
      <name value="테스트"/>
      <time value="월">
        <data day="7" starttime="108" endtime="141" place=""/>
      </time>
    </subject>
  </table>
</response>`;
    const timetable = parseShareResponse(xml);
    expect(timetable.lectures).toHaveLength(0);
  });

  it("starttime >= endtime이면 필터링된다", () => {
    const xml = `<?xml version="1.0"?>
<response>
  <table year="2026" semester="1" status="1" identifier="test">
    <subject id="1">
      <name value="테스트"/>
      <time value="월">
        <data day="0" starttime="141" endtime="108" place=""/>
      </time>
    </subject>
  </table>
</response>`;
    const timetable = parseShareResponse(xml);
    expect(timetable.lectures).toHaveLength(0);
  });

  it("endtime × 5 > 1440인 시간은 필터링된다", () => {
    // endtime=300 → 300×5=1500 > 1440
    const xml = `<?xml version="1.0"?>
<response>
  <table year="2026" semester="1" status="1" identifier="test">
    <subject id="1">
      <name value="테스트"/>
      <time value="월">
        <data day="0" starttime="108" endtime="300" place=""/>
      </time>
    </subject>
  </table>
</response>`;
    const timetable = parseShareResponse(xml);
    expect(timetable.lectures).toHaveLength(0);
  });

  it("잘못된 XML 형식이면 EverytimeScrapeError를 throw한다", () => {
    expect(() => parseShareResponse("not valid xml <<<<")).toThrow(
      EverytimeScrapeError,
    );
  });
});
