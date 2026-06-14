import { NextResponse } from "next/server";
import {
  buildAuthUrl,
  GOOGLE_OAUTH_ORIGIN_COOKIE,
  GOOGLE_OAUTH_ORIGIN_MAX_AGE,
} from "@/lib/google/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/google/auth
 * Google OAuth 동의 화면으로 리다이렉트한다.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const authUrl = buildAuthUrl(undefined, origin);

  const response = NextResponse.redirect(authUrl);
  // 콜백에서 동일한 origin으로 redirect_uri를 맞추기 위해 저장한다.
  const isProd =
    process.env.NODE_ENV === "production" && process.env.E2E_TEST !== "true";
  response.cookies.set(GOOGLE_OAUTH_ORIGIN_COOKIE, origin, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: GOOGLE_OAUTH_ORIGIN_MAX_AGE,
  });
  return response;
}
