import { NextResponse } from "next/server";
import { getValidTokens } from "@/lib/naver/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/naver/calendars
 * Naver Open API는 현재 캘린더 목록 조회를 제공하지 않으므로 기본 캘린더만 반환한다.
 */
export async function GET() {
  const tokens = await getValidTokens();
  if (!tokens) {
    return NextResponse.json(
      {
        error:
          "Naver 계정이 연결되지 않았습니다. /api/naver/auth로 인증해주세요.",
      },
      { status: 401 },
    );
  }

  return NextResponse.json({
    calendars: [
      {
        id: "defaultCalendarId",
        summary: "네이버 기본 캘린더",
        primary: true,
        accessRole: "writer",
      },
    ],
    note: "Naver Open API는 캘린더 목록 조회를 제공하지 않아 기본 캘린더만 사용할 수 있습니다.",
  });
}
