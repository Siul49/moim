import { NextResponse } from "next/server";
import { getValidTokens } from "@/lib/google/auth";
import { listCalendars } from "@/lib/google/calendars";
import { createApiHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

export const GET = createApiHandler({}, async () => {
  const tokens = await getValidTokens();
  if (!tokens) {
    return NextResponse.json(
      {
        error:
          "Google 계정이 연결되지 않았습니다. /api/google/auth로 인증해주세요.",
      },
      { status: 401 },
    );
  }

  try {
    const calendars = await listCalendars(tokens.accessToken);
    return NextResponse.json({ calendars });
  } catch (err) {
    console.error("[google.calendars] 오류:", err);

    if (err instanceof Error && err.message.includes("만료")) {
      return NextResponse.json(
        { error: "Google 인증이 만료되었습니다. 다시 연결해주세요." },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "캘린더 목록 조회 중 오류가 발생했습니다." },
      { status: 502 },
    );
  }
});
