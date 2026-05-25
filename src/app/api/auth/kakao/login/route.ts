import { NextResponse } from "next/server";
import { getKakaoAuthUrl } from "@/lib/auth/kakao";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "kakao_oauth_state";
const STATE_MAX_AGE = 600; // 10분

export async function GET() {
  try {
    const state = crypto.randomUUID();
    const kakaoAuthUrl = getKakaoAuthUrl(state);

    const res = NextResponse.redirect(kakaoAuthUrl);
    res.cookies.set(STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: STATE_MAX_AGE,
    });

    return res;
  } catch (err) {
    console.error(
      "[auth.kakao.login] 오류:",
      err instanceof Error ? err.message : "알 수 없는 오류",
    );
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/login?error=kakao_login_failed`);
  }
}
