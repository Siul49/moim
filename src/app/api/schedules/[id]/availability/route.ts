import { NextRequest, NextResponse } from "next/server";
import {
  addParticipantAvailability,
  getSchedulePublic,
} from "@/lib/schedules/store";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 세션 가져오기
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    const participant = await addParticipantAvailability(id, {
      ...body,
      userId,
    });
    return NextResponse.json(
      {
        participant,
        schedule: await getSchedulePublic(id),
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid request";
    const status = message === "schedule not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
