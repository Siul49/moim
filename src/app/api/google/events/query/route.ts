import { NextRequest, NextResponse } from "next/server";
import { getValidTokens } from "@/lib/google/auth";
import { queryEvents } from "@/lib/google/events";

export const dynamic = "force-dynamic";

/**
 * GET /api/google/events/query?calendarId=...&startDate=...&endDate=...
 * 특정 캘린더의 기간별 일정을 조회한다.
 */
export async function GET(req: NextRequest) {
  const tokens = await getValidTokens();
  if (!tokens) {
    return NextResponse.json(
      { error: "Google 계정이 연결되지 않았습니다." },
      { status: 401 },
    );
  }

  const calendarId = req.nextUrl.searchParams.get("calendarId");
  const startDate = req.nextUrl.searchParams.get("startDate");
  const endDate = req.nextUrl.searchParams.get("endDate");

  if (!calendarId || !startDate || !endDate) {
    return NextResponse.json(
      { error: "calendarId, startDate, endDate 파라미터가 필요합니다." },
      { status: 400 },
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json(
      { error: "날짜 형식이 올바르지 않습니다. ISO 8601 형식을 사용하세요." },
      { status: 400 },
    );
  }

  if (start >= end) {
    return NextResponse.json(
      { error: "endDate는 startDate보다 나중이어야 합니다." },
      { status: 400 },
    );
  }

  try {
    const events = await queryEvents(
      tokens.accessToken,
      calendarId,
      start,
      end,
    );
    return NextResponse.json({ events });
  } catch (err) {
    console.error("[google.events.query] 오류:", err);

    if (err instanceof Error && err.message.includes("만료")) {
      return NextResponse.json(
        { error: "Google 인증이 만료되었습니다." },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "일정 조회 중 오류가 발생했습니다." },
      { status: 502 },
    );
  }
}
