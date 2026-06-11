import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getConnection } from "@/lib/caldav/connection-cookie";

export const dynamic = "force-dynamic";

/**
 * GET /api/calendar/status
 * 현재 브라우저의 캘린더 연동 상태를 반환한다.
 *
 * Google/Naver와 동일하게 연동 정보는 HttpOnly 쿠키에 저장되므로, 별도의 앱
 * 세션 검증 없이 쿠키 존재 여부로 상태를 판단한다.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();

    // 1. Google 연동 확인 (google/auth.ts의 google_tokens 쿠키)
    const googleConnected = !!cookieStore.get("google_tokens")?.value;

    // 2. iCloud 연동 확인 (connection-cookie.ts의 icloud_connection 쿠키)
    const icloud = await getConnection();

    return NextResponse.json({
      googleConnected,
      // 쿠키 저장 방식에는 Google 이메일이 없으므로 미제공
      googleEmail: undefined,
      icloudConnected: !!icloud,
      icloudAppleId: icloud?.appleId ?? undefined,
    });
  } catch (err) {
    console.error("[calendar.status] 오류 발생:", err);
    return NextResponse.json(
      { error: "연동 상태를 조회하는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
