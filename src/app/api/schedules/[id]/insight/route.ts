import { NextResponse } from "next/server";
import { z } from "zod";
import { getScheduleResult } from "@/lib/schedules/store";
import { createApiHandler } from "@/lib/api-handler";
import { generateScheduleInsight } from "@/lib/gemini/insight";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 추천 일정에 대한 Gemini AI 한 줄 해설을 반환한다.
 * 참여 링크를 가진 누구나 결과를 볼 수 있으므로 집계 결과(getScheduleResult)를 사용한다.
 * 해설은 부가 기능이라 키 미설정·생성 실패 시에도 200과 함께 insight: null을 돌려준다.
 */
export const GET = createApiHandler<z.ZodTypeAny, { id: string }>(
  {},
  async ({ params }) => {
    const { id } = params;

    const schedule = await getScheduleResult(id);
    if (!schedule) {
      return NextResponse.json(
        { error: "schedule not found" },
        { status: 404 },
      );
    }

    if (schedule.commonSlots.length === 0) {
      return NextResponse.json({ insight: null });
    }

    const insight = await generateScheduleInsight({
      title: schedule.title,
      durationMinutes: schedule.durationMinutes,
      participantCount: schedule.participants.length,
      recommendedSlots: schedule.commonSlots,
      participants: schedule.participants.map((p) => ({
        name: p.name,
        available: p.available,
      })),
    });

    return NextResponse.json({ insight });
  },
);
