import { XMLParser } from "fast-xml-parser";
import { caldavRequest } from "./client";
import type { CalDAVAuth, RawEventData } from "@/types/icloud";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  isArray: (tagName) => ["response", "propstat"].includes(tagName),
  // calendar-data는 긴 텍스트를 포함하므로 CDATA 처리
  cdataPropName: "__cdata",
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function get(obj: any, ...keys: string[]): any {
  return keys.reduce((cur, k) => (cur != null ? cur[k] : undefined), obj);
}

/** Date를 iCalendar time-range 포맷(YYYYMMDDTHHmmssZ)으로 변환한다. */
function toICalDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * CalDAV REPORT로 특정 기간의 이벤트 raw 데이터를 조회한다.
 * 반환값은 각 이벤트의 href, etag, ICS 문자열 배열이다.
 */
export async function queryEvents(
  calendarUrl: string,
  auth: CalDAVAuth,
  startDate: Date,
  endDate: Date,
): Promise<RawEventData[]> {
  const body = `<?xml version="1.0" encoding="utf-8"?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:getetag/>
    <c:calendar-data/>
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VEVENT">
        <c:time-range
          start="${toICalDate(startDate)}"
          end="${toICalDate(endDate)}"/>
      </c:comp-filter>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`;

  const response = await caldavRequest("REPORT", calendarUrl, auth, {
    body,
    depth: "1",
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });

  // 이벤트 없음 (204 No Content 혹은 빈 207)
  if (response.status === 204 || !response.body.trim()) return [];

  const parsed = parser.parse(response.body);
  const responses = get(parsed, "multistatus", "response") ?? [];
  const results: RawEventData[] = [];

  for (const r of responses) {
    const href = String(r.href ?? "");
    if (!href.endsWith(".ics")) continue;

    const propstats = r.propstat ?? [];
    for (const ps of propstats) {
      const status: string = ps.status ?? "";
      if (!status.includes("200")) continue;

      const etag = String(get(ps, "prop", "getetag") ?? "");

      // calendar-data는 CDATA 또는 일반 텍스트로 반환될 수 있다
      let icsData = get(ps, "prop", "calendar-data") ?? "";
      if (typeof icsData === "object" && icsData.__cdata) {
        icsData = icsData.__cdata;
      }
      icsData = String(icsData).trim();

      if (icsData) {
        results.push({ href, etag, icsData });
      }
    }
  }

  return results;
}
