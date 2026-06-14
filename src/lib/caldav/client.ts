import type { CalDAVAuth } from "@/types/icloud";
import { CalDAVError } from "@/lib/errors";
export { CalDAVError };

export type CalDAVMethod = "PROPFIND" | "REPORT" | "PUT" | "DELETE" | "GET";

/**
 * 클라이언트가 보낸 calendarUrl이 iCloud CalDAV 호스트인지 검증한다.
 *
 * 저장된 Apple 자격증명을 Basic Auth로 실어 보내기 때문에, 임의 호스트로의
 * 요청을 허용하면 자격증명이 공격자 서버로 유출될 수 있다. iCloud의 캘린더
 * URL은 파티션 호스트(p01-caldav.icloud.com 등)를 포함해 항상 icloud.com
 * 도메인 하위이므로 호스트네임을 화이트리스트로 제한한다.
 */
export function isIcloudCalendarUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  return host === "icloud.com" || host.endsWith(".icloud.com");
}

export interface CalDAVRequestOptions {
  body?: string;
  headers?: Record<string, string>;
  depth?: "0" | "1" | "infinity";
  /** 요청 타임아웃 (ms). 기본값 15000 */
  timeoutMs?: number;
}

export interface CalDAVResponse {
  status: number;
  headers: Headers;
  body: string;
}

/**
 * Basic Auth 헤더 값을 생성한다.
 * 서버 전용 코드 — 클라이언트에 노출되면 안 된다.
 */
function buildBasicAuth(auth: CalDAVAuth): string {
  return (
    "Basic " +
    Buffer.from(`${auth.username}:${auth.password}`).toString("base64")
  );
}

/**
 * 리다이렉트를 수동으로 추적하며 CalDAV 요청을 보낸다.
 *
 * iCloud CalDAV는 well-known URL에서 파티션별 URL(p01-caldav.icloud.com 등)로
 * 301/302 리다이렉트를 응답한다. Node.js fetch의 redirect: 'follow'는
 * 다른 호스트로 리다이렉트될 때 Authorization 헤더를 제거하므로
 * 수동으로 처리해야 한다.
 */
export async function caldavRequest(
  method: CalDAVMethod,
  url: string,
  auth: CalDAVAuth,
  options: CalDAVRequestOptions = {},
): Promise<CalDAVResponse> {
  const {
    body,
    headers: extraHeaders = {},
    depth,
    timeoutMs = 15_000,
  } = options;

  const headers: Record<string, string> = {
    Authorization: buildBasicAuth(auth),
    "Content-Type": "application/xml; charset=utf-8",
    ...extraHeaders,
  };
  if (depth !== undefined) headers["Depth"] = depth;

  const MAX_REDIRECTS = 5;
  let currentUrl = url;

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(currentUrl, {
        method,
        headers,
        body,
        redirect: "manual", // 수동 리다이렉트 추적
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    // 리다이렉트 처리 (301, 302, 307, 308)
    if ([301, 302, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) {
        throw new CalDAVError(
          "리다이렉트 응답에 Location 헤더가 없습니다.",
          response.status,
          currentUrl,
        );
      }
      // 상대 경로를 절대 URL로 변환
      currentUrl = location.startsWith("http")
        ? location
        : new URL(location, currentUrl).toString();
      continue;
    }

    const responseBody = await response.text();

    if (response.status === 401) {
      throw new CalDAVError("Apple 계정 인증 실패 (401)", 401, currentUrl);
    }
    if (response.status === 403) {
      throw new CalDAVError("접근 권한 없음 (403)", 403, currentUrl);
    }
    if (response.status >= 500) {
      throw new CalDAVError(
        `iCloud 서버 오류 (${response.status})`,
        response.status,
        currentUrl,
      );
    }

    return {
      status: response.status,
      headers: response.headers,
      body: responseBody,
    };
  }

  throw new CalDAVError("리다이렉트 횟수 초과", 0, url);
}
