import { describe, test, expect, vi } from "vitest";

vi.mock("../client", () => ({
  caldavRequest: vi.fn(),
}));

import { queryEvents } from "../query";
import { caldavRequest } from "../client";

const mockCaldavRequest = vi.mocked(caldavRequest);
const auth = { username: "test@icloud.com", password: "app-password" };

const SAMPLE_MULTISTATUS = `<?xml version="1.0" encoding="UTF-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:response>
    <d:href>/cal/home/event1.ics</d:href>
    <d:propstat>
      <d:status>HTTP/1.1 200 OK</d:status>
      <d:prop>
        <d:getetag>"etag-1"</d:getetag>
        <c:calendar-data>BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:event-1@moim.app
DTSTART:20260415T100000Z
DTEND:20260415T110000Z
SUMMARY:테스트 이벤트
END:VEVENT
END:VCALENDAR</c:calendar-data>
      </d:prop>
    </d:propstat>
  </d:response>
</d:multistatus>`;

describe("queryEvents", () => {
  test("REPORT 응답에서 이벤트를 추출한다", async () => {
    mockCaldavRequest.mockResolvedValueOnce({
      status: 207,
      headers: new Headers(),
      body: SAMPLE_MULTISTATUS,
    });

    const results = await queryEvents(
      "https://caldav.icloud.com/cal/home/",
      auth,
      new Date("2026-04-01T00:00:00Z"),
      new Date("2026-04-30T23:59:59Z"),
    );

    expect(results).toHaveLength(1);
    expect(results[0].href).toBe("/cal/home/event1.ics");
    expect(results[0].etag).toBe('"etag-1"');
    expect(results[0].icsData).toContain("BEGIN:VCALENDAR");
    expect(results[0].icsData).toContain("SUMMARY:테스트 이벤트");
  });

  test("204 응답 시 빈 배열을 반환한다", async () => {
    mockCaldavRequest.mockResolvedValueOnce({
      status: 204,
      headers: new Headers(),
      body: "",
    });

    const results = await queryEvents(
      "https://caldav.icloud.com/cal/home/",
      auth,
      new Date("2026-04-01T00:00:00Z"),
      new Date("2026-04-30T23:59:59Z"),
    );

    expect(results).toEqual([]);
  });

  test("빈 body 시 빈 배열을 반환한다", async () => {
    mockCaldavRequest.mockResolvedValueOnce({
      status: 207,
      headers: new Headers(),
      body: "   ",
    });

    const results = await queryEvents(
      "https://caldav.icloud.com/cal/home/",
      auth,
      new Date("2026-04-01T00:00:00Z"),
      new Date("2026-04-30T23:59:59Z"),
    );

    expect(results).toEqual([]);
  });

  test("REPORT 메서드와 time-range를 포함한 XML을 전송한다", async () => {
    mockCaldavRequest.mockResolvedValueOnce({
      status: 207,
      headers: new Headers(),
      body: "<d:multistatus xmlns:d='DAV:'/>",
    });

    await queryEvents(
      "https://caldav.icloud.com/cal/home/",
      auth,
      new Date("2026-04-01T00:00:00Z"),
      new Date("2026-04-30T23:59:59Z"),
    );

    expect(mockCaldavRequest).toHaveBeenCalledWith(
      "REPORT",
      "https://caldav.icloud.com/cal/home/",
      auth,
      expect.objectContaining({
        depth: "1",
        body: expect.stringContaining("time-range"),
      }),
    );

    // time-range에 올바른 날짜 형식 포함 확인
    const callBody = mockCaldavRequest.mock.calls[0][3]?.body as string;
    expect(callBody).toContain('start="20260401T000000Z"');
    expect(callBody).toContain('end="20260430T235959Z"');
  });

  test(".ics로 끝나지 않는 href는 무시한다", async () => {
    const nonIcsResponse = `<?xml version="1.0" encoding="UTF-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:response>
    <d:href>/cal/home/</d:href>
    <d:propstat>
      <d:status>HTTP/1.1 200 OK</d:status>
      <d:prop>
        <d:getetag>"collection-etag"</d:getetag>
      </d:prop>
    </d:propstat>
  </d:response>
</d:multistatus>`;

    mockCaldavRequest.mockResolvedValueOnce({
      status: 207,
      headers: new Headers(),
      body: nonIcsResponse,
    });

    const results = await queryEvents(
      "https://caldav.icloud.com/cal/home/",
      auth,
      new Date("2026-04-01T00:00:00Z"),
      new Date("2026-04-30T23:59:59Z"),
    );

    expect(results).toEqual([]);
  });
});
