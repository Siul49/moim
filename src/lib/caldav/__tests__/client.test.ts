import { describe, test, expect, vi, beforeEach } from "vitest";
import { caldavRequest, CalDAVError } from "../client";

// fetch를 모킹
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockResponse(
  status: number,
  body: string,
  headers: Record<string, string> = {},
) {
  return {
    status,
    headers: new Headers(headers),
    text: () => Promise.resolve(body),
  };
}

const auth = { username: "test@icloud.com", password: "app-password" };

beforeEach(() => {
  mockFetch.mockReset();
});

describe("CalDAVError", () => {
  test("statusCode와 url을 포함한다", () => {
    const error = new CalDAVError("test error", 401, "https://caldav.test");

    expect(error.message).toBe("test error");
    expect(error.statusCode).toBe(401);
    expect(error.url).toBe("https://caldav.test");
    expect(error.name).toBe("CalDAVError");
  });
});

describe("caldavRequest", () => {
  test("정상 응답을 반환한다", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(207, "<multistatus/>"));

    const result = await caldavRequest(
      "PROPFIND",
      "https://caldav.icloud.com/test",
      auth,
      { body: "<propfind/>", depth: "0" },
    );

    expect(result.status).toBe(207);
    expect(result.body).toBe("<multistatus/>");
  });

  test("Basic Auth 헤더를 올바르게 설정한다", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, "ok"));

    await caldavRequest("GET", "https://caldav.icloud.com/test", auth);

    const callHeaders = mockFetch.mock.calls[0][1].headers;
    const expected =
      "Basic " + Buffer.from("test@icloud.com:app-password").toString("base64");
    expect(callHeaders["Authorization"]).toBe(expected);
  });

  test("Depth 헤더를 설정한다", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, "ok"));

    await caldavRequest("PROPFIND", "https://caldav.icloud.com/test", auth, {
      depth: "1",
    });

    expect(mockFetch.mock.calls[0][1].headers["Depth"]).toBe("1");
  });

  test("301 리다이렉트를 따라간다", async () => {
    mockFetch
      .mockResolvedValueOnce(
        mockResponse(301, "", {
          location: "https://p01-caldav.icloud.com/new",
        }),
      )
      .mockResolvedValueOnce(mockResponse(207, "<redirected/>"));

    const result = await caldavRequest(
      "PROPFIND",
      "https://caldav.icloud.com/old",
      auth,
    );

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.body).toBe("<redirected/>");
  });

  test("상대 경로 리다이렉트를 절대 URL로 변환한다", async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(302, "", { location: "/new-path" }))
      .mockResolvedValueOnce(mockResponse(200, "ok"));

    await caldavRequest("GET", "https://caldav.icloud.com/old", auth);

    const secondCallUrl = mockFetch.mock.calls[1][0];
    expect(secondCallUrl).toBe("https://caldav.icloud.com/new-path");
  });

  test("5회 초과 리다이렉트 시 에러를 던진다", async () => {
    for (let i = 0; i < 7; i++) {
      mockFetch.mockResolvedValueOnce(
        mockResponse(301, "", {
          location: `https://caldav.icloud.com/hop${i}`,
        }),
      );
    }

    await expect(
      caldavRequest("GET", "https://caldav.icloud.com/start", auth),
    ).rejects.toThrow("리다이렉트 횟수 초과");
  });

  test("401 응답 시 CalDAVError를 던진다", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(401, "Unauthorized"));

    await expect(
      caldavRequest("GET", "https://caldav.icloud.com/test", auth),
    ).rejects.toThrow(CalDAVError);
  });

  test("500 응답 시 CalDAVError를 던진다", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(500, "Server Error"));

    await expect(
      caldavRequest("GET", "https://caldav.icloud.com/test", auth),
    ).rejects.toThrow(CalDAVError);
  });

  test("Location 없는 리다이렉트 시 에러를 던진다", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(301, ""));

    await expect(
      caldavRequest("GET", "https://caldav.icloud.com/test", auth),
    ).rejects.toThrow("Location");
  });

  test("redirect: manual 옵션으로 요청한다", async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200, "ok"));

    await caldavRequest("GET", "https://caldav.icloud.com/test", auth);

    expect(mockFetch.mock.calls[0][1].redirect).toBe("manual");
  });
});
