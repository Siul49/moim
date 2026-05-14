import type { EverytimeCredentials, EverytimeSession } from "@/types/everytime";

// ============================================================
// 에브리타임 인증 모듈 — 서버 전용 (credentials 노출 금지)
// ============================================================

const LOGIN_PAGE_URL = "https://account.everytime.kr/login";
const LOGIN_API_URL = "https://account.everytime.kr/api/authenticate/login";

const BASE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Origin: "https://account.everytime.kr",
  Referer: "https://account.everytime.kr/login",
};

export class EverytimeAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EverytimeAuthError";
  }
}

/**
 * 에브리타임에 로그인하고 세션 토큰을 반환한다.
 *
 * 1단계: 로그인 페이지 GET → 세션 쿠키 획득
 * 2단계: 쿠키 + 자격증명으로 POST → 토큰 반환
 *
 * 자격증명은 서버 → 에브리타임 API로만 전송되며 저장되지 않는다.
 */
export async function loginToEverytime(
  credentials: EverytimeCredentials,
): Promise<EverytimeSession> {
  const cookies = await fetchSessionCookies();

  const response = await fetch(LOGIN_API_URL, {
    method: "POST",
    headers: {
      ...BASE_HEADERS,
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Requested-With": "XMLHttpRequest",
      Cookie: cookies,
    },
    body: new URLSearchParams({
      id: credentials.id,
      password: credentials.password,
      keep: "false",
      recaptchaToken: "",
    }),
  });

  if (!response.ok) {
    throw new EverytimeAuthError(
      `에브리타임 서버 응답 오류 (${response.status})`,
    );
  }

  const data = (await response.json()) as unknown;
  return parseLoginResponse(data);
}

function hasGetSetCookie(
  headers: Headers,
): headers is Headers & { getSetCookie: () => string[] } {
  return (
    typeof (headers as unknown as { getSetCookie?: () => string[] })
      .getSetCookie === "function"
  );
}

/**
 * 로그인 페이지를 GET해서 세션 쿠키를 가져온다.
 * etsid(세션 ID)와 x-et-device(기기 식별자)가 포함된다.
 */
async function fetchSessionCookies(): Promise<string> {
  const response = await fetch(LOGIN_PAGE_URL, {
    headers: { "User-Agent": BASE_HEADERS["User-Agent"] },
    redirect: "follow",
  });

  // Node 18+: getSetCookie()로 복수의 Set-Cookie 헤더를 배열로 가져옴
  const setCookies: string[] = hasGetSetCookie(response.headers)
    ? response.headers.getSetCookie()
    : [response.headers.get("set-cookie") ?? ""].filter(Boolean);

  // "name=value; Path=...; ..." → "name=value" 만 추출해서 합침
  return setCookies
    .map((c) => c.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

/** 로그인 응답 JSON을 파싱한다. */
export function parseLoginResponse(data: unknown): EverytimeSession {
  // 성공: { "status": "ok", "token": "TOKEN", "idx": 12345 }
  // 실패: { "status": "not_exists_user" }
  const res = data as Record<string, unknown>;

  if (res.status !== "ok") {
    throw new EverytimeAuthError("아이디 또는 비밀번호가 올바르지 않습니다.");
  }

  const token = String(res.token ?? "");
  const userIdx = String(res.idx ?? "");

  if (!token) {
    throw new EverytimeAuthError("로그인 응답에서 토큰을 찾을 수 없습니다.");
  }
  if (!userIdx) {
    throw new EverytimeAuthError(
      "로그인 응답에서 사용자 ID를 찾을 수 없습니다.",
    );
  }

  return { token, userIdx };
}
