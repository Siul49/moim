import { NextRequest, NextResponse } from "next/server";
import {
  confirmSchedule,
  getScheduleForHost,
  getSchedulePublic,
} from "@/lib/schedules/store";
import {
  HOST_TOKEN_MAX_AGE,
  getHostTokenCookieName,
} from "@/lib/schedules/host-cookie";
import type { TimeSlot } from "@/types/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const hostToken =
    request.nextUrl.searchParams.get("hostToken") ??
    request.cookies.get(getHostTokenCookieName(id))?.value;

  if (hostToken) {
    const hostSchedule = await getScheduleForHost(id, hostToken);
    if (!hostSchedule) {
      return NextResponse.json(
        { error: "invalid host token" },
        { status: 403 },
      );
    }
    const response = NextResponse.json({ schedule: hostSchedule });
    response.cookies.set(getHostTokenCookieName(id), hostToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: HOST_TOKEN_MAX_AGE,
    });
    return response;
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
    const hostToken =
      typeof body.hostToken === "string" && body.hostToken.trim()
        ? body.hostToken
        : request.cookies.get(getHostTokenCookieName(id))?.value;
    if (!hostToken || !isTimeSlot(body.confirmedSlot)) {
      return NextResponse.json(
        { error: "hostToken and confirmedSlot are required" },
        { status: 400 },
      );
    }

    const schedule = await confirmSchedule(id, hostToken, body.confirmedSlot);
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
    ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].includes(slot.day) &&
    Number.isInteger(slot.startHour) &&
    Number.isInteger(slot.endHour) &&
    slot.startHour >= 0 &&
    slot.endHour <= 24 &&
    slot.startHour < slot.endHour
  );
}
