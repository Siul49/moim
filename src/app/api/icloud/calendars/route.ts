import { NextRequest, NextResponse } from "next/server";
import { requireSession, UnauthorizedError } from "@/lib/auth/session";
import { decrypt, deserializeEncrypted, maskEmail } from "@/lib/crypto";
import { discoverCalDAV } from "@/lib/caldav/discovery";
import { CalDAVError } from "@/lib/caldav/client";
import { createClient } from "@/shared/lib/supabase/server";
import type { ICloudConnectionRow, ICloudCalendarRow } from "@/types/icloud";

export async function GET(req: NextRequest) {
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

  const connectionId = req.nextUrl.searchParams.get("connectionId");
  const supabase = await createClient();

  // ── 2. 연결 정보 조회 ─────────────────────────────────────
  let query = supabase
    .from("icloud_connections")
    .select("*")
    .eq("profile_id", session.userId)
    .eq("is_active", true);

  if (connectionId) {
    query = query.eq("id", connectionId);
  }

  const { data: rawConnection, error: connError } = await query.single();
  const connection = rawConnection as ICloudConnectionRow | null;

  if (connError || !connection) {
    return NextResponse.json(
      { error: "연결된 iCloud 계정이 없습니다. 먼저 계정을 연결해주세요." },
      { status: 404 },
    );
  }

  // ── 3. DB 캐시에서 캘린더 목록 우선 반환 ──────────────────
  const { data: cachedCalendars } = await supabase
    .from("icloud_calendars")
    .select("*")
    .eq("connection_id", connection.id)
    .order("display_name");

  // ctag를 비교해 캐시 유효성 체크할 수 있지만,
  // MVP에서는 캐시가 있으면 그대로 반환한다.
  if (cachedCalendars && cachedCalendars.length > 0) {
    return NextResponse.json({
      calendars: (cachedCalendars as ICloudCalendarRow[]).map((c) => ({
        id: c.id,
        displayName: c.display_name,
        calendarUrl: c.calendar_url,
        color: c.color,
      })),
      cached: true,
    });
  }

  // ── 4. 캐시 없으면 CalDAV에서 실시간 조회 ─────────────────
  try {
    const plainPassword = decrypt(
      deserializeEncrypted(
        connection.encrypted_password,
        connection.encryption_iv,
      ),
    );

    const discovery = await discoverCalDAV({
      username: connection.apple_id,
      password: plainPassword,
    });

    // ── 5. DB 캐시 갱신 ────────────────────────────────────
    if (discovery.calendars.length > 0) {
      await supabase.from("icloud_calendars").upsert(
        discovery.calendars.map((c) => ({
          connection_id: connection.id,
          display_name: c.displayName,
          calendar_url: c.url,
          color: c.color ?? null,
          ctag: c.ctag ?? null,
          synced_at: new Date().toISOString(),
        })),
        { onConflict: "connection_id,calendar_url" },
      );
    }

    // 새로 저장된 캘린더를 id 포함해서 다시 조회
    const { data: freshCalendars } = await supabase
      .from("icloud_calendars")
      .select("*")
      .eq("connection_id", connection.id)
      .order("display_name");

    return NextResponse.json({
      calendars: ((freshCalendars as ICloudCalendarRow[]) ?? []).map((c) => ({
        id: c.id,
        displayName: c.display_name,
        calendarUrl: c.calendar_url,
        color: c.color,
      })),
      cached: false,
    });
  } catch (err) {
    if (err instanceof CalDAVError && err.statusCode === 401) {
      return NextResponse.json(
        { error: "iCloud 인증이 만료되었습니다. 계정을 다시 연결해주세요." },
        { status: 401 },
      );
    }

    console.error("[icloud.calendars] 오류", {
      userId: session.userId,
      appleId: maskEmail(connection.apple_id),
      error: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json(
      { error: "캘린더 목록 조회 중 오류가 발생했습니다." },
      { status: 502 },
    );
  }
}
