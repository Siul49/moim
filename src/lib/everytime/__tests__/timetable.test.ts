import { describe, expect, it } from "vitest";
import { parseSemesterResponse, parseSubjectListResponse } from "../timetable";
import { EverytimeFetchError } from "../timetable";

describe("parseSemesterResponse", () => {
  it("정상 응답 XML에서 semester id를 반환한다", () => {
    const xml = `<response status="ok"><semester id="100" year="2025" semester="1"/></response>`;
    expect(parseSemesterResponse(xml)).toBe("100");
  });

  it("status가 ok가 아니면 EverytimeFetchError를 throw한다", () => {
    const xml = `<response status="error"/>`;
    expect(() => parseSemesterResponse(xml)).toThrow(EverytimeFetchError);
  });
});

describe("parseSubjectListResponse", () => {
  it("강의 목록 XML을 파싱해 lectures 배열을 반환한다", () => {
    const xml = `
      <response status="ok">
        <subject id="1">
          <name>데이터구조</name>
          <time day="1" start="540" end="630"/>
          <time day="3" start="540" end="630"/>
        </subject>
        <subject id="2">
          <name>알고리즘</name>
          <time day="2" start="780" end="870"/>
        </subject>
      </response>
    `;
    const timetable = parseSubjectListResponse(xml);

    expect(timetable.lectures).toHaveLength(2);

    const ds = timetable.lectures[0];
    expect(ds.name).toBe("데이터구조");
    expect(ds.times).toHaveLength(2);
    expect(ds.times[0]).toEqual({ day: 1, startMinute: 540, endMinute: 630 });
    expect(ds.times[1]).toEqual({ day: 3, startMinute: 540, endMinute: 630 });

    const algo = timetable.lectures[1];
    expect(algo.name).toBe("알고리즘");
    expect(algo.times[0]).toEqual({ day: 2, startMinute: 780, endMinute: 870 });
  });

  it("강의가 없으면 빈 배열을 반환한다", () => {
    const xml = `<response status="ok"/>`;
    const timetable = parseSubjectListResponse(xml);
    expect(timetable.lectures).toEqual([]);
  });

  it("status가 ok가 아니면 EverytimeFetchError를 throw한다", () => {
    const xml = `<response status="error"/>`;
    expect(() => parseSubjectListResponse(xml)).toThrow(EverytimeFetchError);
  });

  it("유효하지 않은 time 속성은 필터링된다", () => {
    const xml = `
      <response status="ok">
        <subject id="1">
          <name>테스트</name>
          <time day="1" start="540" end="630"/>
          <time day="8" start="100" end="200"/>
        </subject>
      </response>
    `;
    const timetable = parseSubjectListResponse(xml);
    // day=8은 유효하지 않으므로 필터링
    expect(timetable.lectures[0].times).toHaveLength(1);
  });
});
