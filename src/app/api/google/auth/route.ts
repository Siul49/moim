import { NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/google/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/google/auth
 * Google OAuth 동의 화면으로 리다이렉트한다.
 */
export async function GET() {
  const authUrl = buildAuthUrl();
  return NextResponse.redirect(authUrl);
}
