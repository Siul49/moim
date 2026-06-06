import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  getUserProfile,
  saveTokensToCookie,
  validateAndClearOAuthState,
} from "@/lib/naver/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/naver/callback
 * Naver OAuth 콜백. authorization code를 토큰으로 교환한 뒤 쿠키에 저장한다.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");
  const errorDescription = req.nextUrl.searchParams.get("error_description");

  if (error) {
    return NextResponse.json(
      { error: `Naver OAuth 거부: ${errorDescription ?? error}` },
      { status: 400 },
    );
  }

  if (!code || !state) {
    return NextResponse.json(
      { error: "authorization code 또는 state가 없습니다." },
      { status: 400 },
    );
  }

  const isValidState = await validateAndClearOAuthState(state);
  if (!isValidState) {
    return NextResponse.json(
      { error: "Naver OAuth state 검증에 실패했습니다." },
      { status: 400 },
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code, state);
    const profile = await getUserProfile(tokens.accessToken);

    await saveTokensToCookie(tokens);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const identifier = profile.email ?? profile.nickname ?? profile.id;

    return NextResponse.redirect(
      `${baseUrl}/api/naver/calendars?connected=true&user=${encodeURIComponent(identifier)}`,
    );
  } catch (err) {
    console.error("[naver.callback] 오류:", err);
    return NextResponse.json(
      { error: "Naver 계정 연결에 실패했습니다." },
      { status: 500 },
    );
  }
}

