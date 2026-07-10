/**
 * 연동된 외부 캘린더(Google / iCloud)의 이벤트를 기간별로 모아 표준
 * `CalendarEvent[]`로 반환한다.
 *
 * 연동 여부는 쿠키 기반이다(Google `google_tokens`, iCloud `icloud_connection`).
 * 두 소스 중 하나가 실패해도 나머지 결과는 보존한다(부분 성공 허용).
 */

import type { CalendarEvent } from "@/types/calendar-event";
import { getValidTokens } from "@/lib/google/auth";
import { listCalendars } from "@/lib/google/calendars";
import { queryEvents as queryGoogleEvents } from "@/lib/google/events";
import { googleAdapter } from "@/lib/calendar/adapters/google";
import { getConnectionAuth } from "@/lib/caldav/connection-cookie";
import { discoverCalDAV } from "@/lib/caldav/discovery";
import { queryEvents as queryCalDAVEvents } from "@/lib/caldav/query";
import { parseIcsToEvents } from "@/lib/ics/parser";
import { icloudAdapter } from "@/lib/calendar/adapters/icloud";

export interface ConnectedEventsResult {
  events: CalendarEvent[];
  googleConnected: boolean;
  icloudConnected: boolean;
  /** 소스별 조회 실패 메시지(부분 실패 시 디버깅용) */
  errors: { source: "google" | "icloud"; message: string }[];
}

/**
 * 주어진 기간(start~end) 안의 연동 캘린더 이벤트를 모두 가져온다.
 */
export async function fetchConnectedCalendarEvents(
  start: Date,
  end: Date,
): Promise<ConnectedEventsResult> {
  const errors: ConnectedEventsResult["errors"] = [];

  const [google, icloud] = await Promise.all([
    fetchGoogleEvents(start, end).catch((err) => {
      errors.push({ source: "google", message: errorMessage(err) });
      return { connected: true, events: [] as CalendarEvent[] };
    }),
    fetchICloudEvents(start, end).catch((err) => {
      errors.push({ source: "icloud", message: errorMessage(err) });
      return { connected: true, events: [] as CalendarEvent[] };
    }),
  ]);

  return {
    events: [...google.events, ...icloud.events],
    googleConnected: google.connected,
    icloudConnected: icloud.connected,
    errors,
  };
}

async function fetchGoogleEvents(
  start: Date,
  end: Date,
): Promise<{ connected: boolean; events: CalendarEvent[] }> {
  const tokens = await getValidTokens();
  if (!tokens) return { connected: false, events: [] };

  const calendars = await listCalendars(tokens.accessToken);
  const perCalendar = await Promise.all(
    calendars.map((cal) =>
      queryGoogleEvents(tokens.accessToken, cal.id, start, end).catch(() => []),
    ),
  );

  const events = googleAdapter.toCalendarEvents(perCalendar.flat());
  return { connected: true, events };
}

async function fetchICloudEvents(
  start: Date,
  end: Date,
): Promise<{ connected: boolean; events: CalendarEvent[] }> {
  const auth = await getConnectionAuth();
  if (!auth) return { connected: false, events: [] };

  const credentials = { username: auth.appleId, password: auth.password };
  const discovery = await discoverCalDAV(credentials);

  const perCalendar = await Promise.all(
    discovery.calendars.map((cal) =>
      queryCalDAVEvents(cal.url, credentials, start, end)
        .then((raw) => raw.flatMap((item) => parseIcsToEvents(item.icsData)))
        .catch(() => []),
    ),
  );

  const events = icloudAdapter.toCalendarEvents(perCalendar.flat());
  return { connected: true, events };
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "unknown error";
}
