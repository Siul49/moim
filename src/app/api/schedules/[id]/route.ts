import { NextRequest, NextResponse } from "next/server";
import {
  confirmSchedule,
  getScheduleForHost,
  getSchedulePublic,
} from "@/lib/schedules/store";
import type { TimeSlot } from "@/types/schedule";

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (typeof body.hostToken !== "string" || !isTimeSlot(body.confirmedSlot)) {
      return NextResponse.json(
        { error: "hostToken and confirmedSlot are required" },
        { status: 400 },
      );
    }

    const schedule = await confirmSchedule(
      id,
      body.hostToken,
      body.confirmedSlot,
    );
    return NextResponse.json({ schedule });
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid request";
    const status =
      message === "schedule not found"
        ? 404
        : message === "invalid host token"
          ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

function isTimeSlot(value: unknown): value is TimeSlot {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const slot = value as Partial<TimeSlot>;
  return (
    typeof slot.day === "string" &&
    Number.isInteger(slot.startHour) &&
    Number.isInteger(slot.endHour)
  );
}
