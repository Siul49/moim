import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, UnauthorizedError } from "@/lib/auth/session";
import { decrypt, deserializeEncrypted } from "@/lib/crypto";
import { queryEvents } from "@/lib/caldav/query";
import { parseIcsToEvents } from "@/lib/ics/parser";
import { CalDAVError } from "@/lib/caldav/client";
import { createClient } from "@/shared/lib/supabase/server";
import type { ICloudConnectionRow, ICloudCalendarRow } from "@/types/icloud";

const QuerySchema = z.object({
  calendarId: z.string().uuid("calendarId는 UUID 형식이어야 합니다."),
  startDate: z
    .string()
    .datetime({ message: "startDate는 ISO 8601 형식이어야 합니다." }),
  endDate: z
    .string()
    .datetime({ message: "endDate는 ISO 8601 형식이어야 합니다." }),
});

export async function POST(req: NextRequest) {
  // ── 1. 인증 검증 ──────────────────────────────────────────
  let session;
  try {
    session = await requireSession();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 },
      );
    }
    throw e;
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
  const { calendarId, startDate, endDate } = parsed.data;

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start >= end) {
    return NextResponse.json(
      { error: "endDate는 startDate보다 나중이어야 합니다." },
      { status: 400 },
    );
  }

  // ── 3. 캘린더 + 연결 정보 조회 (소유권 확인) ──────────────
  const supabase = await createClient();

  const { data: calendar, error: calError } = await supabase
    .from("icloud_calendars")
    .select("*, icloud_connections(*)")
    .eq("id", calendarId)
    .single();

  if (calError || !calendar) {
    return NextResponse.json(
      { error: "캘린더를 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  // RLS로 보호되지만 소유권을 한 번 더 확인
  const connection = (
    calendar as ICloudCalendarRow & {
      icloud_connections: ICloudConnectionRow;
    }
  ).icloud_connections;

  if (!connection || connection.profile_id !== session.userId) {
    return NextResponse.json(
      { error: "접근 권한이 없습니다." },
      { status: 403 },
    );
  }

  // ── 4. CalDAV REPORT ──────────────────────────────────────
  try {
    const plainPassword = decrypt(
      deserializeEncrypted(
        connection.encrypted_password,
        connection.encryption_iv,
      ),
    );

    const rawEvents = await queryEvents(
      (calendar as ICloudCalendarRow).calendar_url,
      { username: connection.apple_id, password: plainPassword },
      start,
      end,
    );

    // ── 5. ICS 파싱 ───────────────────────────────────────
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
      userId: session.userId,
      calendarId,
      error: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json(
      { error: "일정 조회 중 오류가 발생했습니다." },
      { status: 502 },
    );
  }
}
