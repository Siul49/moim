import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  getUserEmail,
  saveTokensToCookie,
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
    const tokens = await exchangeCodeForTokens(code);
    const email = await getUserEmail(tokens.accessToken);

    await saveTokensToCookie(tokens);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    return NextResponse.redirect(
      `${baseUrl}/api/google/calendars?connected=true&email=${encodeURIComponent(email)}`,
    );
  } catch (err) {
    console.error("[google.callback] 오류:", err);
    return NextResponse.json(
      { error: "Google 계정 연결에 실패했습니다." },
      { status: 500 },
    );
  }
}
