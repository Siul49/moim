import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import type { NaverTokens, NaverUserProfile } from "@/types/naver-calendar";

// ============================================================
// Naver OAuth 2.0 인증 모듈
// ============================================================

const NAVER_AUTH_URL = "https://nid.naver.com/oauth2.0/authorize";
const NAVER_TOKEN_URL = "https://nid.naver.com/oauth2.0/token";
const NAVER_PROFILE_URL = "https://openapi.naver.com/v1/nid/me";

const TOKEN_COOKIE_NAME = "naver_tokens";
const STATE_COOKIE_NAME = "naver_oauth_state";

function getClientId(): string {
  const id = process.env.NAVER_CLIENT_ID;
  if (!id) throw new Error("NAVER_CLIENT_ID 환경변수가 설정되지 않았습니다.");
  return id;
}

function getClientSecret(): string {
  const secret = process.env.NAVER_CLIENT_SECRET;
  if (!secret)
    throw new Error("NAVER_CLIENT_SECRET 환경변수가 설정되지 않았습니다.");
  return secret;
}

function getRedirectUri(): string {
  const explicit = process.env.NAVER_CALENDAR_REDIRECT_URI;
  if (explicit) return explicit;

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  return `${base}/api/naver/callback`;
}

/**
 * 토큰 응답에서 공통 필드(accessToken/tokenType/expiresAt)를 타입 안전하게 파싱한다.
 * expires_in이 문자열/누락/0 등으로 들어와도 안전하게 검증한다.
 */
function parseTokenResponse(data: {
  access_token: string;
  token_type?: string;
  expires_in: unknown;
}): { accessToken: string; tokenType: string; expiresAt: number } {
  const expiresIn = parseInt(String(data.expires_in), 10);
  if (!expiresIn || expiresIn <= 0) {
    throw new Error("토큰 응답의 expires_in이 유효하지 않습니다.");
  }

  return {
    accessToken: data.access_token,
    tokenType: data.token_type ?? "bearer",
    expiresAt: Date.now() + expiresIn * 1000,
  };
}

/** CSRF 방지를 위한 OAuth state 값을 생성한다. */
export function createOAuthState(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Naver OAuth 인증 URL을 생성한다.
 * Naver는 state 파라미터를 필수로 요구한다.
 */
export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    state,
  });

  return `${NAVER_AUTH_URL}?${params.toString()}`;
}

/** state 값을 짧은 수명의 HttpOnly 쿠키에 저장한다. */
export async function saveOAuthStateToCookie(state: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
}

/** 콜백 state 값을 검증하고 state 쿠키를 제거한다. */
export async function validateAndClearOAuthState(
  receivedState: string | null,
): Promise<boolean> {
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE_NAME)?.value;
  cookieStore.delete(STATE_COOKIE_NAME);

  return Boolean(
    receivedState && expectedState && receivedState === expectedState,
  );
}

/**
 * Authorization code를 access_token + refresh_token으로 교환한다.
 */
export async function exchangeCodeForTokens(
  code: string,
  state: string,
): Promise<NaverTokens> {
  const response = await fetch(NAVER_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: getClientId(),
      client_secret: getClientSecret(),
      redirect_uri: getRedirectUri(),
      code,
      state,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`토큰 교환 실패 (${response.status}): ${error}`);
  }

  const data = await response.json();

  return {
    ...parseTokenResponse(data),
    refreshToken: data.refresh_token,
  };
}

/**
 * refresh_token으로 새 access_token을 발급받는다.
 * Naver는 갱신 응답에 새 refresh_token을 포함할 수 있으므로 함께 반환한다.
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  tokenType: string;
  expiresAt: number;
  refreshToken?: string;
}> {
  const response = await fetch(NAVER_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: getClientId(),
      client_secret: getClientSecret(),
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`토큰 갱신 실패 (${response.status}): ${error}`);
  }

  const data = await response.json();

  return {
    ...parseTokenResponse(data),
    refreshToken: data.refresh_token,
  };
}

/** 네이버 사용자 프로필을 조회한다. */
export async function getUserProfile(
  accessToken: string,
): Promise<NaverUserProfile> {
  const response = await fetch(NAVER_PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`사용자 정보 조회 실패 (${response.status}): ${error}`);
  }

  const data = await response.json();
  const profile = data.response ?? {};

  if (!profile.id) {
    throw new Error("네이버 사용자 ID가 응답에 없습니다.");
  }

  return {
    id: profile.id,
    email: profile.email,
    nickname: profile.nickname,
    name: profile.name,
  };
}

/** 토큰을 HttpOnly 쿠키에 저장한다. */
export async function saveTokensToCookie(tokens: NaverTokens): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE_NAME, JSON.stringify(tokens), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

/** 쿠키에서 토큰을 읽고, 만료됐으면 자동 갱신한다. */
export async function getValidTokens(): Promise<NaverTokens | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
  if (!raw) return null;

  let tokens: NaverTokens;
  try {
    tokens = JSON.parse(raw);
  } catch (err) {
    console.error(
      `[naver.auth] 토큰 쿠키 파싱 실패 (cookie: ${TOKEN_COOKIE_NAME}):`,
      err instanceof Error ? err.stack : err,
    );
    return null;
  }

  if (tokens.expiresAt - Date.now() < 5 * 60 * 1000) {
    try {
      const refreshed = await refreshAccessToken(tokens.refreshToken);
      tokens = {
        ...tokens,
        accessToken: refreshed.accessToken,
        tokenType: refreshed.tokenType,
        expiresAt: refreshed.expiresAt,
        // Naver는 갱신 시 새 refresh_token을 줄 수 있다. 있으면 최신 값으로 교체한다.
        refreshToken: refreshed.refreshToken ?? tokens.refreshToken,
      };
      await saveTokensToCookie(tokens);
    } catch (err) {
      const redacted = tokens.refreshToken
        ? tokens.refreshToken.slice(0, 10) + "..."
        : "null";
      console.error(
        `[naver.auth] 토큰 갱신 실패 (refreshToken: ${redacted}):`,
        err instanceof Error ? err.stack : err,
      );
      return null;
    }
  }

  return tokens;
}

/** 토큰 쿠키를 삭제한다. */
export async function clearTokensCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE_NAME);
}
