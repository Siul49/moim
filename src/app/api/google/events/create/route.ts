import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getValidTokens } from "@/lib/google/auth";
import { createEvent } from "@/lib/google/events";

export const dynamic = "force-dynamic";

const CreateEventSchema = z.object({
  calendarId: z.string().min(1, "calendarId는 필수입니다."),
  summary: z
    .string()
    .min(1, "제목은 1자 이상이어야 합니다.")
    .max(255, "제목은 255자 이하여야 합니다."),
  startDateTime: z.string().datetime({
    offset: true,
    message: "startDateTime은 ISO 8601 형식이어야 합니다.",
  }),
  endDateTime: z.string().datetime({
    offset: true,
    message: "endDateTime은 ISO 8601 형식이어야 합니다.",
  }),
  location: z.string().max(500).optional(),
  description: z.string().max(8000).optional(),
  timeZone: z.string().optional(),
});

/**
 * POST /api/google/events/create
 * Google Calendar에 새 일정을 생성한다.
 */
export async function POST(req: NextRequest) {
  const tokens = await getValidTokens();
  if (!tokens) {
    return NextResponse.json(
      { error: "Google 계정이 연결되지 않았습니다." },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { calendarId, summary, startDateTime, endDateTime, ...rest } =
    parsed.data;

  if (new Date(startDateTime) >= new Date(endDateTime)) {
    return NextResponse.json(
      { error: "endDateTime은 startDateTime보다 나중이어야 합니다." },
      { status: 400 },
    );
  }

  try {
    const event = await createEvent(tokens.accessToken, calendarId, {
      summary,
      startDateTime,
      endDateTime,
      ...rest,
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    console.error("[google.events.create] 오류:", err);

    if (err instanceof Error && err.message.includes("만료")) {
      return NextResponse.json(
        { error: "Google 인증이 만료되었습니다." },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "일정 생성 중 오류가 발생했습니다." },
      { status: 502 },
    );
  }
}
