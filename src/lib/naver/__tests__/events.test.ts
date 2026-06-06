import { describe, test, expect, vi, beforeEach } from "vitest";
import { buildNaverScheduleIcal, createEvent } from "../events";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
  process.env.NAVER_CLIENT_ID = "naver-client-id";
  process.env.NAVER_CLIENT_SECRET = "naver-client-secret";
});

describe("buildNaverScheduleIcal", () => {
  test("네이버 createSchedule용 iCalendar 문자열을 만든다", () => {
    const ical = buildNaverScheduleIcal({
      uid: "uid-123@moim.app",
      summary: "팀 미팅",
      startDateTime: "2026-06-06T10:00:00+09:00",
      endDateTime: "2026-06-06T11:00:00+09:00",
      location: "강남역",
      description: "주간 회의",
    });

    expect(ical).toContain("BEGIN:VCALENDAR");
    expect(ical).toContain("PRODID:Naver Calendar");
    expect(ical).toContain("UID:uid-123@moim.app");
    expect(ical).toContain("DTSTART;TZID=Asia/Seoul:20260606T100000");
    expect(ical).toContain("DTEND;TZID=Asia/Seoul:20260606T110000");
    expect(ical).toContain("SUMMARY:팀 미팅");
    expect(ical).toContain("LOCATION:강남역");
    expect(ical).toContain("DESCRIPTION:주간 회의");
  });

  test("텍스트 값을 ICS 규칙에 맞게 이스케이프한다", () => {
    const ical = buildNaverScheduleIcal({
      uid: "uid",
      summary: "회의,점검;확인",
      startDateTime: "2026-06-06T10:00:00+09:00",
      endDateTime: "2026-06-06T11:00:00+09:00",
      description: "첫 줄\n둘째 줄",
    });

    expect(ical).toContain("SUMMARY:회의\\,점검\\;확인");
    expect(ical).toContain("DESCRIPTION:첫 줄\\n둘째 줄");
  });

  test("다른 오프셋의 ISO 시간을 Asia/Seoul 로컬 시간으로 변환한다", () => {
    const ical = buildNaverScheduleIcal({
      uid: "uid",
      summary: "시차 테스트",
      startDateTime: "2026-06-06T01:00:00Z",
      endDateTime: "2026-06-06T02:30:00Z",
    });

    expect(ical).toContain("DTSTART;TZID=Asia/Seoul:20260606T100000");
    expect(ical).toContain("DTEND;TZID=Asia/Seoul:20260606T113000");
  });
});

describe("createEvent", () => {
  test("네이버 캘린더에 새 일정을 생성한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          result: "success",
          code: 200,
          returnValue: {
            calendarId: "17061888",
            processType: "create",
            icalUid: "uid-123",
          },
        }),
    });

    const event = await createEvent("access-token", {
      uid: "uid-123@moim.app",
      summary: "네이버 일정",
      startDateTime: "2026-06-06T10:00:00+09:00",
      endDateTime: "2026-06-06T11:00:00+09:00",
    });

    expect(event).toEqual({
      calendarId: "17061888",
      processType: "create",
      icalUid: "uid-123",
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe(
      "https://openapi.naver.com/calendar/createSchedule.json",
    );
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer access-token");
    expect(options.headers["Content-Type"]).toBe(
      "application/x-www-form-urlencoded",
    );
    expect(options.headers["X-Naver-Client-Id"]).toBe("naver-client-id");
    expect(options.headers["X-Naver-Client-Secret"]).toBe(
      "naver-client-secret",
    );
    expect(options.body.get("calendarId")).toBe("defaultCalendarId");
    expect(options.body.get("scheduleIcalString")).toContain(
      "SUMMARY:네이버 일정",
    );
  });

  test("calendarId를 지정하면 요청 body에 반영한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          result: "success",
          code: 200,
          returnValue: {
            calendarId: "custom-calendar",
            processType: "create",
            icalUid: "uid",
          },
        }),
    });

    await createEvent("token", {
      calendarId: "custom-calendar",
      summary: "테스트",
      startDateTime: "2026-06-06T10:00:00+09:00",
      endDateTime: "2026-06-06T11:00:00+09:00",
    });

    expect(mockFetch.mock.calls[0][1].body.get("calendarId")).toBe(
      "custom-calendar",
    );
  });

  test("401 응답 시 인증 실패 에러를 던진다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve("Unauthorized"),
    });

    await expect(
      createEvent("expired", {
        summary: "실패",
        startDateTime: "2026-06-06T10:00:00+09:00",
        endDateTime: "2026-06-06T11:00:00+09:00",
      }),
    ).rejects.toThrow("인증 실패");
  });

  test("실패 결과를 받으면 에러를 던진다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          result: "failure",
          code: 500,
          message: "invalid schedule",
        }),
    });

    await expect(
      createEvent("token", {
        summary: "실패",
        startDateTime: "2026-06-06T10:00:00+09:00",
        endDateTime: "2026-06-06T11:00:00+09:00",
      }),
    ).rejects.toThrow("invalid schedule");
  });
});
