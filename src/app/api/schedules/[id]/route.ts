import { NextRequest, NextResponse } from "next/server";
import {
  getScheduleForHost,
  getSchedulePublic,
} from "@/lib/schedules/in-memory-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const hostToken = request.nextUrl.searchParams.get("hostToken");

  if (hostToken) {
    const hostSchedule = getScheduleForHost(params.id, hostToken);
    if (!hostSchedule) {
      return NextResponse.json(
        { error: "invalid host token" },
        { status: 403 },
      );
    }
    return NextResponse.json({ schedule: hostSchedule });
  }

  const schedule = getSchedulePublic(params.id);
  if (!schedule) {
    return NextResponse.json({ error: "schedule not found" }, { status: 404 });
  }

  return NextResponse.json({ schedule });
}
