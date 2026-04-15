import { cookies } from "next/headers";
import type { GoogleTokens } from "@/types/google-calendar";

// ============================================================
// Google OAuth 2.0 인증 모듈
// ============================================================

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// 캘린더 읽기/쓰기 + 사용자 이메일 조회
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

const TOKEN_COOKIE_NAME = "google_tokens";

function getClientId(): string {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) throw new Error("GOOGLE_CLIENT_ID 환경변수가 설정되지 않았습니다.");
  return id;
}

function getClientSecret(): string {
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!secret)
    throw new Error("GOOGLE_CLIENT_SECRET 환경변수가 설정되지 않았습니다.");
  return secret;
}

function getRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  return `${base}/api/google/callback`;
}

/**
 * Google OAuth 인증 URL을 생성한다.
 * 사용자를 이 URL로 리다이렉트하면 Google 동의 화면이 표시된다.
 */
export function buildAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline", // refresh_token 발급
    prompt: "consent", // 항상 동의 화면 표시 (refresh_token 보장)
  });
  if (state) params.set("state", state);

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Authorization code를 access_token + refresh_token으로 교환한다.
 */
export async function exchangeCodeForTokens(
  code: string,
): Promise<GoogleTokens> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`토큰 교환 실패 (${response.status}): ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

/**
 * refresh_token으로 새 access_token을 발급받는다.
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<{ accessToken: string; expiresAt: number }> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`토큰 갱신 실패 (${response.status}): ${error}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Google 사용자 이메일을 조회한다.
 */
export async function getUserEmail(accessToken: string): Promise<string> {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!response.ok) throw new Error("사용자 정보 조회 실패");

  const data = await response.json();
  return data.email;
}

// ============================================================
// 쿠키 기반 토큰 저장/조회
// Supabase DB 연결 전까지 임시 저장소로 사용
// ============================================================

/** 토큰을 HttpOnly 쿠키에 저장한다. */
export async function saveTokensToCookie(tokens: GoogleTokens): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE_NAME, JSON.stringify(tokens), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30일
  });
}

/** 쿠키에서 토큰을 읽고, 만료됐으면 자동 갱신한다. */
export async function getValidTokens(): Promise<GoogleTokens | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
  if (!raw) return null;

  let tokens: GoogleTokens;
  try {
    tokens = JSON.parse(raw);
  } catch {
    return null;
  }

  // 만료 5분 전이면 갱신
  if (tokens.expiresAt - Date.now() < 5 * 60 * 1000) {
    try {
      const refreshed = await refreshAccessToken(tokens.refreshToken);
      tokens = {
        ...tokens,
        accessToken: refreshed.accessToken,
        expiresAt: refreshed.expiresAt,
      };
      await saveTokensToCookie(tokens);
    } catch {
      return null; // 갱신 실패 → 재로그인 필요
    }
  }

  return tokens;
}

/** 토큰 쿠키를 삭제한다. */
export async function clearTokensCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE_NAME);
}
