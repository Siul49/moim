import { NextRequest, NextResponse } from "next/server";
import {
  APPLE_STATE_COOKIE,
  APPLE_STATE_MAX_AGE,
  getAppleAuthUrl,
} from "@/lib/auth/apple";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const state = crypto.randomUUID();
    const authUrl = getAppleAuthUrl(state, req.nextUrl.origin);

    const res = NextResponse.redirect(authUrl);
    res.cookies.set(APPLE_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: APPLE_STATE_MAX_AGE,
    });

    return res;
  } catch (err) {
    console.error(
      "[auth.apple.login] error:",
      err instanceof Error ? err.message : "unknown error",
    );
    return NextResponse.redirect(
      `${req.nextUrl.origin}/login?error=apple_login_failed`,
    );
  }
}
