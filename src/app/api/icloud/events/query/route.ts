import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { maskEmail } from "@/lib/crypto";
import { queryEvents } from "@/lib/caldav/query";
import { parseIcsToEvents } from "@/lib/ics/parser";
import { CalDAVError } from "@/lib/caldav/client";
import { getConnectionAuth } from "@/lib/caldav/connection-cookie";

export const dynamic = "force-dynamic";

const QuerySchema = z.object({
  calendarUrl: z
    .string()
    .url("calendarUrl은 올바른 URL 형식이어야 합니다.")
    .startsWith("https://", "calendarUrl은 https URL이어야 합니다."),
  startDate: z
    .string()
    .datetime({ message: "startDate는 ISO 8601 형식이어야 합니다." }),
  endDate: z
    .string()
    .datetime({ message: "endDate는 ISO 8601 형식이어야 합니다." }),
});

export async function POST(req: NextRequest) {
  // ── 1. 연결 정보 확인 ─────────────────────────────────────
  const connection = await getConnectionAuth();
  if (!connection) {
    return NextResponse.json(
      { error: "연결된 iCloud 계정이 없습니다. 먼저 계정을 연결해주세요." },
      { status: 404 },
    );
  }

  // ── 2. 입력 검증 ──────────────────────────────────────────
  const body = await req.json().catch(() => null);
  const parsed = QuerySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const { calendarUrl, startDate, endDate } = parsed.data;

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start >= end) {
    return NextResponse.json(
      { error: "endDate는 startDate보다 나중이어야 합니다." },
      { status: 400 },
    );
  }

  // ── 3. CalDAV REPORT ──────────────────────────────────────
  try {
    const rawEvents = await queryEvents(
      calendarUrl,
      { username: connection.appleId, password: connection.password },
      start,
      end,
    );

    // ── 4. ICS 파싱 ───────────────────────────────────────
    const events = rawEvents.flatMap((raw) =>
      parseIcsToEvents(raw.icsData).map((e) => ({
        uid: e.uid,
        title: e.title,
        startAt: e.startAt.toISOString(),
        endAt: e.endAt.toISOString(),
        location: e.location ?? null,
        description: e.description ?? null,
        isAllDay: e.isAllDay,
        etag: raw.etag,
      })),
    );

    return NextResponse.json({ events });
  } catch (err) {
    if (err instanceof CalDAVError && err.statusCode === 401) {
      return NextResponse.json(
        { error: "iCloud 인증이 만료되었습니다. 계정을 다시 연결해주세요." },
        { status: 401 },
      );
    }

    console.error("[icloud.events.query] 오류", {
      appleId: maskEmail(connection.appleId),
      error: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json(
      { error: "일정 조회 중 오류가 발생했습니다." },
      { status: 502 },
    );
  }
}
