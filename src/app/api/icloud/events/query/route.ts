import { NextResponse } from "next/server";
import { z } from "zod";
import { maskEmail } from "@/lib/crypto";
import { queryEvents } from "@/lib/caldav/query";
import { parseIcsToEvents } from "@/lib/ics/parser";
import { CalDAVError, isIcloudCalendarUrl } from "@/lib/caldav/client";
import { getConnectionAuth } from "@/lib/caldav/connection-cookie";
import { createApiHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

const QuerySchema = z
  .object({
    calendarUrl: z
      .string()
      .url("calendarUrl은 올바른 URL 형식이어야 합니다.")
      .startsWith("https://", "calendarUrl은 https URL이어야 합니다.")
      .refine(isIcloudCalendarUrl, {
        message: "허용되지 않은 iCloud 캘린더 URL입니다.",
      }),
    startDate: z
      .string()
      .datetime({ message: "startDate는 ISO 8601 형식이어야 합니다." }),
    endDate: z
      .string()
      .datetime({ message: "endDate는 ISO 8601 형식이어야 합니다." }),
  })
  .refine((data) => new Date(data.startDate) < new Date(data.endDate), {
    message: "endDate는 startDate보다 나중이어야 합니다.",
    path: ["endDate"],
  });

export const POST = createApiHandler(
  {
    bodySchema: QuerySchema,
  },
  async ({ body }) => {
    const connection = await getConnectionAuth();
    if (!connection) {
      return NextResponse.json(
        { error: "연결된 iCloud 계정이 없습니다. 먼저 계정을 연결해주세요." },
        { status: 404 },
      );
    }

    const { calendarUrl, startDate, endDate } = body;
    const start = new Date(startDate);
    const end = new Date(endDate);

    try {
      const rawEvents = await queryEvents(
        calendarUrl,
        { username: connection.appleId, password: connection.password },
        start,
        end,
      );

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
  },
);
