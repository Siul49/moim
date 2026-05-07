import { describe, test, expect, vi, beforeEach } from "vitest";
import { queryEvents, createEvent } from "../events";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe("queryEvents", () => {
  test("기간별 이벤트를 조회한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [
            {
              id: "event-1",
              summary: "팀 미팅",
              start: { dateTime: "2026-04-15T10:00:00+09:00" },
              end: { dateTime: "2026-04-15T11:00:00+09:00" },
              status: "confirmed",
              htmlLink: "https://calendar.google.com/event?id=1",
            },
            {
              id: "event-2",
              summary: "점심",
              start: { dateTime: "2026-04-15T12:00:00+09:00" },
              end: { dateTime: "2026-04-15T13:00:00+09:00" },
              status: "confirmed",
            },
          ],
        }),
    });

    const events = await queryEvents(
      "token",
      "primary",
      new Date("2026-04-15T00:00:00Z"),
      new Date("2026-04-15T23:59:59Z"),
    );

    expect(events).toHaveLength(2);
    expect(events[0].summary).toBe("팀 미팅");
    expect(events[1].summary).toBe("점심");
  });

  test("취소된 이벤트를 필터링한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [
            {
              id: "active",
              summary: "활성 이벤트",
              start: { dateTime: "2026-04-15T10:00:00Z" },
              end: { dateTime: "2026-04-15T11:00:00Z" },
              status: "confirmed",
            },
            {
              id: "cancelled",
              summary: "취소된 이벤트",
              start: { dateTime: "2026-04-15T14:00:00Z" },
              end: { dateTime: "2026-04-15T15:00:00Z" },
              status: "cancelled",
            },
          ],
        }),
    });

    const events = await queryEvents(
      "token",
      "primary",
      new Date("2026-04-15T00:00:00Z"),
      new Date("2026-04-15T23:59:59Z"),
    );

    expect(events).toHaveLength(1);
    expect(events[0].id).toBe("active");
  });

  test("singleEvents=true와 orderBy=startTime으로 요청한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    });

    await queryEvents(
      "token",
      "primary",
      new Date("2026-04-01T00:00:00Z"),
      new Date("2026-04-30T23:59:59Z"),
    );

    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain("singleEvents=true");
    expect(url).toContain("orderBy=startTime");
  });

  test("calendarId를 URL 인코딩한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    });

    await queryEvents(
      "token",
      "user@gmail.com",
      new Date("2026-04-01T00:00:00Z"),
      new Date("2026-04-30T23:59:59Z"),
    );

    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain("user%40gmail.com");
  });

  test("401 응답 시 인증 만료 에러를 던진다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve("Unauthorized"),
    });

    await expect(
      queryEvents(
        "expired",
        "primary",
        new Date("2026-04-01T00:00:00Z"),
        new Date("2026-04-30T23:59:59Z"),
      ),
    ).rejects.toThrow("만료");
  });

  test("제목이 없는 이벤트는 '(제목 없음)'으로 표시한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [
            {
              id: "no-title",
              start: { dateTime: "2026-04-15T10:00:00Z" },
              end: { dateTime: "2026-04-15T11:00:00Z" },
              status: "confirmed",
            },
          ],
        }),
    });

    const events = await queryEvents(
      "token",
      "primary",
      new Date("2026-04-15T00:00:00Z"),
      new Date("2026-04-15T23:59:59Z"),
    );

    expect(events[0].summary).toBe("(제목 없음)");
  });
});

describe("createEvent", () => {
  test("새 이벤트를 생성한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "new-event-id",
          summary: "새 일정",
          start: { dateTime: "2026-04-16T14:00:00+09:00" },
          end: { dateTime: "2026-04-16T15:00:00+09:00" },
          status: "confirmed",
          htmlLink: "https://calendar.google.com/event?id=new",
        }),
    });

    const event = await createEvent("token", "primary", {
      summary: "새 일정",
      startDateTime: "2026-04-16T14:00:00+09:00",
      endDateTime: "2026-04-16T15:00:00+09:00",
    });

    expect(event.id).toBe("new-event-id");
    expect(event.summary).toBe("새 일정");
  });

  test("POST 메서드와 JSON body로 요청한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "e",
          summary: "test",
          start: {},
          end: {},
          status: "confirmed",
        }),
    });

    await createEvent("token", "primary", {
      summary: "테스트",
      startDateTime: "2026-04-16T14:00:00+09:00",
      endDateTime: "2026-04-16T15:00:00+09:00",
      location: "강남역",
      description: "설명",
      timeZone: "Asia/Seoul",
    });

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/calendars/primary/events");
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");

    const body = JSON.parse(options.body);
    expect(body.summary).toBe("테스트");
    expect(body.location).toBe("강남역");
    expect(body.description).toBe("설명");
    expect(body.start.timeZone).toBe("Asia/Seoul");
  });

  test("timeZone 미지정 시 Asia/Seoul을 기본값으로 사용한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "e",
          summary: "t",
          start: {},
          end: {},
          status: "confirmed",
        }),
    });

    await createEvent("token", "primary", {
      summary: "기본 타임존",
      startDateTime: "2026-04-16T14:00:00+09:00",
      endDateTime: "2026-04-16T15:00:00+09:00",
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.start.timeZone).toBe("Asia/Seoul");
    expect(body.end.timeZone).toBe("Asia/Seoul");
  });

  test("401 응답 시 인증 만료 에러를 던진다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve("Unauthorized"),
    });

    await expect(
      createEvent("expired", "primary", {
        summary: "실패",
        startDateTime: "2026-04-16T14:00:00Z",
        endDateTime: "2026-04-16T15:00:00Z",
      }),
    ).rejects.toThrow("만료");
  });
});
