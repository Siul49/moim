import { NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/google/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/google/auth
 * Google OAuth 동의 화면으로 리다이렉트한다.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const authUrl = buildAuthUrl(undefined, origin);
  return NextResponse.redirect(authUrl);
}
