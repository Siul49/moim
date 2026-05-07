import { describe, test, expect, vi, beforeEach } from "vitest";
import { listCalendars } from "../calendars";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe("listCalendars", () => {
  test("캘린더 목록을 올바르게 파싱한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          items: [
            {
              id: "primary",
              summary: "내 캘린더",
              backgroundColor: "#4285f4",
              primary: true,
              accessRole: "owner",
            },
            {
              id: "work@gmail.com",
              summary: "업무",
              description: "업무 일정",
              backgroundColor: "#0b8043",
              accessRole: "writer",
            },
          ],
        }),
    });

    const calendars = await listCalendars("test-access-token");

    expect(calendars).toHaveLength(2);
    expect(calendars[0]).toMatchObject({
      id: "primary",
      summary: "내 캘린더",
      primary: true,
    });
    expect(calendars[1]).toMatchObject({
      id: "work@gmail.com",
      summary: "업무",
      description: "업무 일정",
    });
  });

  test("Authorization 헤더를 올바르게 설정한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    });

    await listCalendars("my-token");

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers["Authorization"]).toBe("Bearer my-token");
  });

  test("minAccessRole=writer로 요청한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    });

    await listCalendars("token");

    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain("minAccessRole=writer");
  });

  test("401 응답 시 인증 만료 에러를 던진다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: () => Promise.resolve("Unauthorized"),
    });

    await expect(listCalendars("expired-token")).rejects.toThrow("만료");
  });

  test("items가 없으면 빈 배열을 반환한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const calendars = await listCalendars("token");
    expect(calendars).toEqual([]);
  });
});
