import { NextRequest, NextResponse } from "next/server";
import {
  addParticipantAvailability,
  getSchedulePublic,
} from "@/lib/schedules/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const participant = await addParticipantAvailability(
      id,
      await request.json(),
    );
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
