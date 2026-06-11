import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { maskEmail } from "@/lib/crypto";
import { createEvent } from "@/lib/caldav/create";
import { buildIcs } from "@/lib/ics/builder";
import { CalDAVError } from "@/lib/caldav/client";
import { getConnectionAuth } from "@/lib/caldav/connection-cookie";

export const dynamic = "force-dynamic";

const CreateEventSchema = z.object({
  calendarUrl: z
    .string()
    .url("calendarUrl은 올바른 URL 형식이어야 합니다.")
    .startsWith("https://", "calendarUrl은 https URL이어야 합니다."),
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
  const parsed = CreateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  const { calendarUrl, title, startAt, endAt, location, description } =
    parsed.data;

  const start = new Date(startAt);
  const end = new Date(endAt);
  if (start >= end) {
    return NextResponse.json(
      { error: "종료 시간이 시작 시간보다 늦어야 합니다." },
      { status: 400 },
    );
  }

  // ── 3. ICS 빌드 ───────────────────────────────────────────
  const { uid, icsContent } = buildIcs({
    title,
    startAt: start,
    endAt: end,
    location,
    description,
  });

  // ── 4. CalDAV PUT ─────────────────────────────────────────
  try {
    const result = await createEvent(
      calendarUrl,
      { username: connection.appleId, password: connection.password },
      uid,
      icsContent,
    );

    console.info("[icloud.events.create] 일정 생성 성공", {
      appleId: maskEmail(connection.appleId),
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
      appleId: maskEmail(connection.appleId),
      error: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json(
      { error: "일정 생성 중 오류가 발생했습니다." },
      { status: 502 },
    );
  }
}
