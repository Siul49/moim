import { NextResponse } from "next/server";
import { z } from "zod";
import { maskEmail } from "@/lib/crypto";
import { discoverCalDAV } from "@/lib/caldav/discovery";
import { CalDAVError } from "@/lib/caldav/client";
import { saveConnection } from "@/lib/caldav/connection-cookie";
import { createApiHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

const ConnectSchema = z.object({
  appleId: z.string().email("올바른 Apple ID 이메일 형식이어야 합니다."),
  appPassword: z
    .string()
    .min(1, "앱 전용 암호를 입력해주세요.")
    .regex(
      /^[a-z]{4}-[a-z]{4}-[a-z]{4}-[a-z]{4}$|^.{4,}$/,
      "앱 전용 암호 형식이 올바르지 않습니다.",
    ),
});

export const POST = createApiHandler(
  {
    bodySchema: ConnectSchema,
  },
  async ({ body }) => {
    const { appleId, appPassword } = body;

    try {
      const discovery = await discoverCalDAV({
        username: appleId,
        password: appPassword,
      });

      await saveConnection({
        appleId,
        appPassword,
        principalUrl: discovery.principalUrl,
        calendarHomeUrl: discovery.calendarHomeUrl,
      });

      console.info("[icloud.connect] 연결 성공", {
        appleId: maskEmail(appleId),
        calendarsCount: discovery.calendars.length,
      });

      return NextResponse.json({
        appleId,
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
          appleId: maskEmail(appleId),
          statusCode: err.statusCode,
          message: err.message,
        });
        return NextResponse.json(
          {
            error:
              "iCloud 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
          },
          { status: 502 },
        );
      }

      console.error("[icloud.connect] 예상치 못한 오류", {
        appleId: maskEmail(appleId),
        error: err instanceof Error ? err.message : "unknown",
      });
      return NextResponse.json(
        { error: "서버 오류가 발생했습니다." },
        { status: 500 },
      );
    }
  },
);
