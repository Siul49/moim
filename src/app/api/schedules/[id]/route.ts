import { NextRequest, NextResponse } from "next/server";
import { getScheduleForHost, getSchedulePublic } from "@/lib/schedules/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const hostToken = request.nextUrl.searchParams.get("hostToken");

  if (hostToken) {
    const hostSchedule = await getScheduleForHost(id, hostToken);
    if (!hostSchedule) {
      return NextResponse.json(
        { error: "invalid host token" },
        { status: 403 },
      );
    }
    return NextResponse.json({ schedule: hostSchedule });
  }

  const schedule = await getSchedulePublic(id);
  if (!schedule) {
    return NextResponse.json({ error: "schedule not found" }, { status: 404 });
  }

  return NextResponse.json({ schedule });
}
