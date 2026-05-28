import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/auth/google";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "google_oauth_state";
const STATE_MAX_AGE = 600; // 10분

export async function GET(request: NextRequest) {
  try {
    const state = crypto.randomUUID();
    const googleAuthUrl = getGoogleAuthUrl(state);

    const res = NextResponse.redirect(googleAuthUrl);
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
      "[auth.google.login] 오류:",
      err instanceof Error ? err.message : "알 수 없는 오류",
    );
    const origin = new URL(request.url).origin;
    return NextResponse.redirect(`${origin}/login?error=google_login_failed`);
  }
}
