import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, UnauthorizedError } from "@/lib/auth/session";
import { encrypt, serializeEncrypted, maskEmail } from "@/lib/crypto";
import { discoverCalDAV } from "@/lib/caldav/discovery";
import { CalDAVError } from "@/lib/caldav/client";
import { createClient } from "@/shared/lib/supabase/server";
import type { CalendarInfo } from "@/types/icloud";

export const dynamic = "force-dynamic";

const ConnectSchema = z.object({
  appleId: z.string().email("올바른 Apple ID 이메일 형식이어야 합니다."),
  appPassword: z
    .string()
    .min(1, "앱 전용 암호를 입력해주세요.")
    // iCloud 앱 전용 암호 형식: xxxx-xxxx-xxxx-xxxx
    .regex(
      /^[a-z]{4}-[a-z]{4}-[a-z]{4}-[a-z]{4}$|^.{4,}$/,
      "앱 전용 암호 형식이 올바르지 않습니다.",
    ),
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
  const parsed = ConnectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const { appleId, appPassword } = parsed.data;

  // ── 3. CalDAV Discovery ───────────────────────────────────
  try {
    const discovery = await discoverCalDAV({
      username: appleId,
      password: appPassword,
    });

    // ── 4. 앱 전용 암호 암호화 ───────────────────────────────
    const encryptedData = encrypt(appPassword);
    const encryptedPassword = serializeEncrypted(encryptedData);
    const encryptionIv = encryptedData.iv;

    // ── 5. DB upsert ─────────────────────────────────────────
    const supabase = await createClient();

    const { data: connection, error: connError } = await supabase
      .from("icloud_connections")
      .upsert(
        {
          profile_id: session.userId,
          apple_id: appleId,
          encrypted_password: encryptedPassword,
          encryption_iv: encryptionIv,
          principal_url: discovery.principalUrl,
          calendar_home_url: discovery.calendarHomeUrl,
          is_active: true,
          last_verified_at: new Date().toISOString(),
        },
        { onConflict: "profile_id,apple_id" },
      )
      .select("id")
      .single();

    if (connError || !connection) {
      console.error("[icloud.connect] DB upsert 실패", {
        userId: session.userId,
        appleId: maskEmail(appleId),
        error: connError?.message,
      });
      return NextResponse.json(
        { error: "연결 정보 저장 중 오류가 발생했습니다." },
        { status: 500 },
      );
    }

    // ── 6. 캘린더 목록 upsert ─────────────────────────────────
    if (discovery.calendars.length > 0) {
      const calendarRows = discovery.calendars.map((c: CalendarInfo) => ({
        connection_id: connection.id,
        display_name: c.displayName,
        calendar_url: c.url,
        color: c.color ?? null,
        ctag: c.ctag ?? null,
        synced_at: new Date().toISOString(),
      }));

      const { error: calError } = await supabase
        .from("icloud_calendars")
        .upsert(calendarRows, { onConflict: "connection_id,calendar_url" });

      if (calError) {
        console.warn("[icloud.connect] 캘린더 목록 저장 실패 (연결은 성공)", {
          userId: session.userId,
          error: calError.message,
        });
      }
    }

    console.info("[icloud.connect] 연결 성공", {
      userId: session.userId,
      appleId: maskEmail(appleId),
      calendarsCount: discovery.calendars.length,
    });

    return NextResponse.json({
      connectionId: connection.id,
      principalUrl: discovery.principalUrl,
      calendarHomeUrl: discovery.calendarHomeUrl,
      calendarsCount: discovery.calendars.length,
    });
  } catch (err) {
    if (err instanceof CalDAVError) {
      if (err.statusCode === 401) {
        return NextResponse.json(
          {
            error:
              "Apple 계정 인증에 실패했습니다. Apple ID와 앱 전용 암호를 확인해주세요.",
          },
          { status: 401 },
        );
      }
      console.error("[icloud.connect] CalDAV 오류", {
        userId: session.userId,
        appleId: maskEmail(appleId),
        statusCode: err.statusCode,
        message: err.message,
      });
      return NextResponse.json(
        {
          error: "iCloud 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
        },
        { status: 502 },
      );
    }

    console.error("[icloud.connect] 예상치 못한 오류", {
      userId: session.userId,
      appleId: maskEmail(appleId),
      error: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
