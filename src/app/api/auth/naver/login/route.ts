import { NextRequest, NextResponse } from "next/server";
import { getNaverAuthUrl } from "@/lib/auth/naver";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "naver_oauth_state";
const STATE_MAX_AGE = 600; // 10분

export async function GET(request: NextRequest) {
  try {
    const state = crypto.randomUUID();
    const naverAuthUrl = getNaverAuthUrl(state);

    const res = NextResponse.redirect(naverAuthUrl);
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
      "[auth.naver.login] 오류:",
      err instanceof Error ? err.message : "알 수 없는 오류",
    );
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/login?error=naver_login_failed`);
  }
}
