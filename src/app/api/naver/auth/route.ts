import { NextResponse } from "next/server";
import {
  buildAuthUrl,
  createOAuthState,
  saveOAuthStateToCookie,
} from "@/lib/naver/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/naver/auth
 * Naver OAuth 동의 화면으로 리다이렉트한다.
 */
export async function GET() {
  const state = createOAuthState();
  await saveOAuthStateToCookie(state);

  return NextResponse.redirect(buildAuthUrl(state));
}
