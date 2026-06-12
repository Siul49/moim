import { NextResponse } from "next/server";
import { maskEmail } from "@/lib/crypto";
import { discoverCalDAV } from "@/lib/caldav/discovery";
import { CalDAVError } from "@/lib/caldav/client";
import { getConnectionAuth } from "@/lib/caldav/connection-cookie";
import { createApiHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

/**
 * GET /api/icloud/calendars
 * 연결된 iCloud 계정의 캘린더 컬렉션 목록을 CalDAV에서 실시간 조회한다.
 */
export const GET = createApiHandler({}, async () => {
  const connection = await getConnectionAuth();
  if (!connection) {
    return NextResponse.json(
      { error: "연결된 iCloud 계정이 없습니다. 먼저 계정을 연결해주세요." },
      { status: 404 },
    );
  }

  try {
    const discovery = await discoverCalDAV({
      username: connection.appleId,
      password: connection.password,
    });

    return NextResponse.json({
      calendars: discovery.calendars.map((c) => ({
        calendarUrl: c.url,
        displayName: c.displayName,
        color: c.color ?? null,
      })),
    });
  } catch (err) {
    if (err instanceof CalDAVError && err.statusCode === 401) {
      return NextResponse.json(
        { error: "iCloud 인증이 만료되었습니다. 계정을 다시 연결해주세요." },
        { status: 401 },
      );
    }

    console.error("[icloud.calendars] 오류", {
      appleId: maskEmail(connection.appleId),
      error: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json(
      { error: "캘린더 목록 조회 중 오류가 발생했습니다." },
      { status: 502 },
    );
  }
});
