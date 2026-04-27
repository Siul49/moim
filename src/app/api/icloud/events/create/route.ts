import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, UnauthorizedError } from "@/lib/auth/session";
import { decrypt, deserializeEncrypted, maskEmail } from "@/lib/crypto";
import { createEvent } from "@/lib/caldav/create";
import { buildIcs } from "@/lib/ics/builder";
import { CalDAVError } from "@/lib/caldav/client";
import { createClient } from "@/lib/supabase/server";
import type { ICloudConnectionRow, ICloudCalendarRow } from "@/types/icloud";

export const dynamic = "force-dynamic";

const CreateEventSchema = z.object({
  calendarId: z.string().uuid("calendarId는 UUID 형식이어야 합니다."),
  title: z
    .string()
    .min(1, "제목을 입력해주세요.")
    .max(255, "제목은 255자 이하여야 합니다."),
  startAt: z
    .string()
    .datetime({ message: "startAt은 ISO 8601 형식이어야 합니다." }),
  endAt: z
    .string()
    .datetime({ message: "endAt은 ISO 8601 형식이어야 합니다." }),
  location: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
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
  const parsed = CreateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const { calendarId, title, startAt, endAt, location, description } =
    parsed.data;

  const start = new Date(startAt);
  const end = new Date(endAt);
  if (start >= end) {
    return NextResponse.json(
      { error: "종료 시간이 시작 시간보다 늦어야 합니다." },
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

  // ── 4. ICS 빌드 ───────────────────────────────────────────
  const { uid, icsContent } = buildIcs({
    title,
    startAt: start,
    endAt: end,
    location,
    description,
  });

  // ── 5. CalDAV PUT ─────────────────────────────────────────
  try {
    const plainPassword = decrypt(
      deserializeEncrypted(
        connection.encrypted_password,
        connection.encryption_iv,
      ),
    );

    const result = await createEvent(
      (calendar as ICloudCalendarRow).calendar_url,
      { username: connection.apple_id, password: plainPassword },
      uid,
      icsContent,
    );

    console.info("[icloud.events.create] 일정 생성 성공", {
      userId: session.userId,
      calendarId,
      uid,
    });

    return NextResponse.json(
      { uid, eventUrl: result.href, etag: result.etag },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof CalDAVError) {
      if (err.statusCode === 401) {
        return NextResponse.json(
          { error: "iCloud 인증이 만료되었습니다. 계정을 다시 연결해주세요." },
          { status: 401 },
        );
      }
      if (err.statusCode === 412) {
        // If-None-Match: * 조건 실패 → 같은 UID의 이벤트가 이미 존재
        return NextResponse.json(
          { error: "동일한 일정이 이미 존재합니다." },
          { status: 409 },
        );
      }
    }

    console.error("[icloud.events.create] 오류", {
      userId: session.userId,
      calendarId,
      appleId: maskEmail(connection.apple_id),
      error: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json(
      { error: "일정 생성 중 오류가 발생했습니다." },
      { status: 502 },
    );
  }
}
