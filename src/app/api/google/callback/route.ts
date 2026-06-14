import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  getUserEmail,
  saveTokensToCookie,
  GOOGLE_OAUTH_ORIGIN_COOKIE,
} from "@/lib/google/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/google/callback
 * Google OAuth 콜백. authorization code를 토큰으로 교환한 뒤 쿠키에 저장한다.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.json(
      { error: `Google OAuth 거부: ${error}` },
      { status: 400 },
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: "authorization code가 없습니다." },
      { status: 400 },
    );
  }

  try {
    // 인증 시작 시 저장한 origin을 우선 사용해 redirect_uri를 일치시킨다.
    // 쿠키가 없으면(만료 등) 현재 요청 origin으로 안전하게 폴백한다.
    const savedOrigin = req.cookies.get(GOOGLE_OAUTH_ORIGIN_COOKIE)?.value;
    const origin = savedOrigin || new URL(req.url).origin;

    const tokens = await exchangeCodeForTokens(code, origin);
    const email = await getUserEmail(tokens.accessToken);

    await saveTokensToCookie(tokens);

    // 사용자 페이지로 리다이렉트한다. (JSON API로 보내면 raw JSON이 노출됨)
    const response = NextResponse.redirect(
      `${origin}/calendar/connect?connected=google&email=${encodeURIComponent(email)}`,
    );
    // 1회용 origin 쿠키 정리
    response.cookies.set(GOOGLE_OAUTH_ORIGIN_COOKIE, "", {
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (err) {
    console.error("[google.callback] 오류:", err);
    return NextResponse.json(
      { error: "Google 계정 연결에 실패했습니다." },
      { status: 500 },
    );
  }
}
