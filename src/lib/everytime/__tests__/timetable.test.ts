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

  it("semester id가 없으면 EverytimeFetchError를 throw한다", () => {
    const xml = `<response status="ok"><semester year="2025"/></response>`;
    expect(() => parseSemesterResponse(xml)).toThrow(EverytimeFetchError);
  });

  it("잘못된 XML 형식이면 EverytimeFetchError를 throw한다", () => {
    expect(() => parseSemesterResponse("not valid xml <<<<")).toThrow(
      EverytimeFetchError,
    );
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

  it("day=0(월요일)과 day=6(일요일) 경계값을 허용한다", () => {
    const xml = `
      <response status="ok">
        <subject id="1">
          <name>월요일수업</name>
          <time day="0" start="540" end="630"/>
        </subject>
        <subject id="2">
          <name>일요일수업</name>
          <time day="6" start="540" end="630"/>
        </subject>
      </response>
    `;
    const timetable = parseSubjectListResponse(xml);
    expect(timetable.lectures[0].times[0].day).toBe(0);
    expect(timetable.lectures[1].times[0].day).toBe(6);
  });

  it("startMinute >= endMinute인 시간은 필터링된다", () => {
    const xml = `
      <response status="ok">
        <subject id="1">
          <name>테스트</name>
          <time day="1" start="630" end="540"/>
        </subject>
      </response>
    `;
    const timetable = parseSubjectListResponse(xml);
    expect(timetable.lectures[0].times).toHaveLength(0);
  });

  it("endMinute > 1440인 시간은 필터링된다", () => {
    const xml = `
      <response status="ok">
        <subject id="1">
          <name>테스트</name>
          <time day="1" start="540" end="1500"/>
        </subject>
      </response>
    `;
    const timetable = parseSubjectListResponse(xml);
    expect(timetable.lectures[0].times).toHaveLength(0);
  });

  it("startMinute < 0인 시간은 필터링된다", () => {
    const xml = `
      <response status="ok">
        <subject id="1">
          <name>테스트</name>
          <time day="1" start="-10" end="100"/>
        </subject>
      </response>
    `;
    const timetable = parseSubjectListResponse(xml);
    expect(timetable.lectures[0].times).toHaveLength(0);
  });
});
