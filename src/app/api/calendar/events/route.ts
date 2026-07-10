import { NextRequest, NextResponse } from "next/server";
import { fetchConnectedCalendarEvents } from "@/lib/calendar/fetch-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/calendar/events?start=<ISO>&end=<ISO>
 *
 * 현재 브라우저에 연동된 Google / iCloud 캘린더에서 주어진 기간의 이벤트를
 * 조회해 표준 형태로 반환한다. 후보 격자의 "바쁜 시간" 자동 필터링에 쓰인다.
 *
 * 응답의 startAt/endAt은 ISO 문자열이며, 요일/시간 격자 변환은 사용자 로컬
 * 시간대를 따르도록 클라이언트에서 수행한다.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  const start = startParam ? new Date(startParam) : defaultStart();
  const end = endParam ? new Date(endParam) : defaultEnd(start);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
    return NextResponse.json(
      { error: "유효한 start/end 기간이 필요합니다." },
      { status: 400 },
    );
  }

  try {
    const result = await fetchConnectedCalendarEvents(start, end);
    return NextResponse.json({
      events: result.events.map((event) => ({
        id: event.id,
        title: event.title,
        startAt: event.startAt.toISOString(),
        endAt: event.endAt.toISOString(),
        isAllDay: event.isAllDay,
        source: event.source,
      })),
      googleConnected: result.googleConnected,
      icloudConnected: result.icloudConnected,
      errors: result.errors,
    });
  } catch (err) {
    console.error("[calendar.events] 오류 발생:", err);
    return NextResponse.json(
      { error: "캘린더 이벤트를 조회하는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

/** 기본 조회 시작: 오늘 0시 */
function defaultStart(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

/** 기본 조회 종료: 시작으로부터 4주 후 */
function defaultEnd(start: Date): Date {
  const end = new Date(start);
  end.setDate(end.getDate() + 28);
  return end;
}
