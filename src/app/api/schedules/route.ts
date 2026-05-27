import { NextRequest, NextResponse } from "next/server";
import {
  createTestSchedule,
  getSchedulePublic,
} from "@/lib/schedule-test/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const created = createTestSchedule(await request.json());
    const schedule = getSchedulePublic(created.id);

    return NextResponse.json(
      {
        schedule,
        participantPath: `/schedule/${created.id}`,
        hostPath: `/schedule/${created.id}?hostToken=${created.hostToken}`,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "invalid request" },
      { status: 400 },
    );
  }
}
