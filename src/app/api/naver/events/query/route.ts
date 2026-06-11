import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/naver/events/query
 * Naver Open API는 일정 조회 API를 제공하지 않는다.
 */
export async function GET() {
  return NextResponse.json(
    {
      error:
        "Naver Open API는 일정 조회를 제공하지 않습니다. 현재는 일정 생성만 지원합니다.",
    },
    { status: 501 },
  );
}

