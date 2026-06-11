import { XMLParser } from "fast-xml-parser";
import { caldavRequest, CalDAVError } from "./client";
import type { CalDAVAuth, DiscoveryResult, CalendarInfo } from "@/types/icloud";

const ICLOUD_CALDAV_BASE = "https://caldav.icloud.com";
const WELL_KNOWN_PATH = "/.well-known/caldav";

// ============================================================
// XML 파서 설정
// removeNSPrefix: true → "D:response" 같은 네임스페이스 접두사 제거
// ============================================================
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  isArray: (tagName) =>
    // response, propstat은 항상 배열로 처리 (단일 항목도 배열)
    ["response", "propstat"].includes(tagName),
});

// ============================================================
// XML 파싱 헬퍼
// ============================================================

/** XMLParser 결과에서 중첩 경로 값을 안전하게 꺼낸다. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function get(obj: any, ...keys: string[]): any {
  return keys.reduce((cur, k) => (cur != null ? cur[k] : undefined), obj);
}

/** href 값을 정규화 — 절대 URL이 아니면 iCloud base를 붙인다. */
function absoluteUrl(href: string): string {
  if (!href) return "";
  return href.startsWith("http") ? href : `${ICLOUD_CALDAV_BASE}${href}`;
}

// ============================================================
// Step 1: Principal URL 조회
// PROPFIND /.well-known/caldav → current-user-principal
// ============================================================
async function discoverPrincipalUrl(auth: CalDAVAuth): Promise<string> {
  const body = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:current-user-principal/>
  </d:prop>
</d:propfind>`;

  const response = await caldavRequest(
    "PROPFIND",
    `${ICLOUD_CALDAV_BASE}${WELL_KNOWN_PATH}`,
    auth,
    { body, depth: "0" },
  );

  const parsed = parser.parse(response.body);

  // multistatus > response[0] > propstat[0] > prop > current-user-principal > href
  const responses = get(parsed, "multistatus", "response") ?? [];
  for (const r of responses) {
    const propstats = r.propstat ?? [];
    for (const ps of propstats) {
      const href = get(ps, "prop", "current-user-principal", "href");
      if (href) return absoluteUrl(String(href));
    }
  }

  throw new CalDAVError(
    "current-user-principal을 찾을 수 없습니다.",
    0,
    WELL_KNOWN_PATH,
  );
}

// ============================================================
// Step 2: Calendar Home URL 조회
// PROPFIND {principalUrl} → calendar-home-set
// ============================================================
async function discoverCalendarHome(
  principalUrl: string,
  auth: CalDAVAuth,
): Promise<string> {
  const body = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <c:calendar-home-set/>
  </d:prop>
</d:propfind>`;

  const response = await caldavRequest("PROPFIND", principalUrl, auth, {
    body,
    depth: "0",
  });

  const parsed = parser.parse(response.body);

  const responses = get(parsed, "multistatus", "response") ?? [];
  for (const r of responses) {
    const propstats = r.propstat ?? [];
    for (const ps of propstats) {
      const href = get(ps, "prop", "calendar-home-set", "href");
      if (href) return absoluteUrl(String(href));
    }
  }

  throw new CalDAVError(
    "calendar-home-set을 찾을 수 없습니다.",
    0,
    principalUrl,
  );
}

// ============================================================
// Step 3: 캘린더 컬렉션 목록 조회
// PROPFIND {calendarHomeUrl} (Depth: 1) → calendar 리소스 필터링
// ============================================================
async function listCalendars(
  calendarHomeUrl: string,
  auth: CalDAVAuth,
): Promise<CalendarInfo[]> {
  const body = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:"
            xmlns:c="urn:ietf:params:xml:ns:caldav"
            xmlns:cs="http://calendarserver.org/ns/"
            xmlns:ic="http://apple.com/ns/ical/">
  <d:prop>
    <d:resourcetype/>
    <d:displayname/>
    <ic:calendar-color/>
    <cs:getctag/>
  </d:prop>
</d:propfind>`;

  const response = await caldavRequest("PROPFIND", calendarHomeUrl, auth, {
    body,
    depth: "1",
  });

  const parsed = parser.parse(response.body);
  const responses = get(parsed, "multistatus", "response") ?? [];
  const calendars: CalendarInfo[] = [];

  for (const r of responses) {
    const href = absoluteUrl(String(r.href ?? ""));
    // home URL 자체는 제외
    if (href === calendarHomeUrl || href === calendarHomeUrl.replace(/\/$/, ""))
      continue;

    const propstats = r.propstat ?? [];
    for (const ps of propstats) {
      const status: string = ps.status ?? "";
      if (!status.includes("200")) continue;

      const prop = ps.prop ?? {};

      // resourcetype에 "calendar" 요소가 있어야 캘린더 컬렉션
      const resourcetype = prop.resourcetype ?? {};
      const isCalendar =
        "calendar" in resourcetype ||
        JSON.stringify(resourcetype).includes("calendar");

      if (!isCalendar) continue;

      calendars.push({
        url: href,
        displayName: String(prop.displayname ?? "이름 없는 캘린더"),
        color: prop["calendar-color"]
          ? String(prop["calendar-color"]).replace(/[^#\w]/g, "")
          : undefined,
        ctag: prop.getctag ? String(prop.getctag) : undefined,
      });
    }
  }

  return calendars;
}

// ============================================================
// 공개 API
// ============================================================

/**
 * Apple ID + 앱 전용 암호로 iCloud CalDAV를 탐색한다.
 * 성공 시 principalUrl / calendarHomeUrl / 캘린더 목록을 반환한다.
 * 인증 실패 시 CalDAVError(statusCode=401)를 던진다.
 */
export async function discoverCalDAV(
  auth: CalDAVAuth,
): Promise<DiscoveryResult> {
  const principalUrl = await discoverPrincipalUrl(auth);
  const calendarHomeUrl = await discoverCalendarHome(principalUrl, auth);
  const calendars = await listCalendars(calendarHomeUrl, auth);

  return { principalUrl, calendarHomeUrl, calendars };
}
