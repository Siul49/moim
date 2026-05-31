import { NextRequest, NextResponse } from "next/server";
import { createSchedule, getSchedulePublic } from "@/lib/schedules/store";
import {
  HOST_TOKEN_MAX_AGE,
  getHostTokenCookieName,
} from "@/lib/schedules/host-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const created = await createSchedule(await request.json());
    const schedule = await getSchedulePublic(created.id);

    const response = NextResponse.json(
      {
        schedule,
        participantPath: `/schedule/${created.id}`,
        hostPath: `/schedule/${created.id}`,
        hostToken: created.hostToken,
      },
      { status: 201 },
    );

    response.cookies.set(
      getHostTokenCookieName(created.id),
      created.hostToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: HOST_TOKEN_MAX_AGE,
      },
    );

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "invalid request" },
      { status: 400 },
    );
  }
}
