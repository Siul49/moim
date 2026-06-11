import { caldavRequest, CalDAVError } from "./client";
import type { CalDAVAuth, CreateEventResult } from "@/types/icloud";

/**
 * CalDAV PUT으로 새 이벤트를 생성한다.
 *
 * @param calendarUrl  캘린더 컬렉션 URL (ex: https://p01-caldav.icloud.com/.../calendars/home/)
 * @param auth         CalDAV 인증 정보
 * @param uid          이벤트 UID (파일명에도 사용됨)
 * @param icsContent   RFC 5545 ICS 문자열
 */
export async function createEvent(
  calendarUrl: string,
  auth: CalDAVAuth,
  uid: string,
  icsContent: string,
): Promise<CreateEventResult> {
  const eventUrl = `${calendarUrl.replace(/\/$/, "")}/${uid}.ics`;

  const response = await caldavRequest("PUT", eventUrl, auth, {
    body: icsContent,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      // If-None-Match: * → 같은 UID가 이미 존재하면 412 Precondition Failed로 실패
      "If-None-Match": "*",
    },
  });

  // 201 Created 또는 204 No Content가 성공 응답
  if (response.status !== 201 && response.status !== 204) {
    throw new CalDAVError(
      `일정 생성 실패 (${response.status})`,
      response.status,
      eventUrl,
    );
  }

  const etag = response.headers.get("ETag") ?? "";

  return { href: eventUrl, etag };
}
