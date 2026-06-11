import { describe, test, expect, vi } from "vitest";

// caldavRequest를 모킹
vi.mock("../client", () => ({
  caldavRequest: vi.fn(),
  CalDAVError: class CalDAVError extends Error {
    constructor(
      message: string,
      public readonly statusCode: number,
      public readonly url: string,
    ) {
      super(message);
      this.name = "CalDAVError";
    }
  },
}));

import { createEvent } from "../create";
import { caldavRequest } from "../client";

const mockCaldavRequest = vi.mocked(caldavRequest);
const auth = { username: "test@icloud.com", password: "app-password" };

describe("createEvent", () => {
  test("올바른 URL로 PUT 요청을 보낸다", async () => {
    mockCaldavRequest.mockResolvedValueOnce({
      status: 201,
      headers: new Headers({ ETag: '"etag-123"' }),
      body: "",
    });

    await createEvent(
      "https://caldav.icloud.com/cal/home/",
      auth,
      "uid-123@moim.app",
      "BEGIN:VCALENDAR...",
    );

    expect(mockCaldavRequest).toHaveBeenCalledWith(
      "PUT",
      "https://caldav.icloud.com/cal/home/uid-123@moim.app.ics",
      auth,
      expect.objectContaining({
        body: "BEGIN:VCALENDAR...",
        headers: expect.objectContaining({
          "If-None-Match": "*",
        }),
      }),
    );
  });

  test("201 응답 시 href와 etag를 반환한다", async () => {
    mockCaldavRequest.mockResolvedValueOnce({
      status: 201,
      headers: new Headers({ ETag: '"etag-abc"' }),
      body: "",
    });

    const result = await createEvent(
      "https://caldav.icloud.com/cal/home/",
      auth,
      "uid-1@moim.app",
      "ics-content",
    );

    expect(result.href).toBe(
      "https://caldav.icloud.com/cal/home/uid-1@moim.app.ics",
    );
    expect(result.etag).toBe('"etag-abc"');
  });

  test("204 응답도 성공으로 처리한다", async () => {
    mockCaldavRequest.mockResolvedValueOnce({
      status: 204,
      headers: new Headers({ ETag: '"etag-204"' }),
      body: "",
    });

    const result = await createEvent(
      "https://caldav.icloud.com/cal/home",
      auth,
      "uid-2@moim.app",
      "ics-content",
    );

    expect(result.href).toBe(
      "https://caldav.icloud.com/cal/home/uid-2@moim.app.ics",
    );
  });

  test("412 응답 시 CalDAVError를 던진다 (중복 UID)", async () => {
    mockCaldavRequest.mockResolvedValueOnce({
      status: 412,
      headers: new Headers(),
      body: "",
    });

    await expect(
      createEvent(
        "https://caldav.icloud.com/cal/home/",
        auth,
        "dup@moim.app",
        "ics-content",
      ),
    ).rejects.toThrow("일정 생성 실패");
  });

  test("calendarUrl 끝의 슬래시를 정규화한다", async () => {
    mockCaldavRequest.mockResolvedValueOnce({
      status: 201,
      headers: new Headers({ ETag: '"e"' }),
      body: "",
    });

    const result = await createEvent(
      "https://caldav.icloud.com/cal/home/",
      auth,
      "uid@moim.app",
      "ics",
    );

    // 슬래시 중복 없이 올바른 URL
    expect(result.href).toBe(
      "https://caldav.icloud.com/cal/home/uid@moim.app.ics",
    );
  });
});
