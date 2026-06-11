import { NextRequest, NextResponse } from "next/server";
import { createSchedule, getSchedulePublic } from "@/lib/schedules/store";
import { createClient } from "@/lib/supabase/server";
import {
  HOST_TOKEN_MAX_AGE,
  getHostTokenCookieName,
} from "@/lib/schedules/host-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const created = await createSchedule({
      ...body,
      creatorId: user?.id || null,
    });
    const schedule = await getSchedulePublic(created.id);

    const response = NextResponse.json(
      {
        schedule,
        participantPath: `/schedule/${created.id}`,
        hostPath: `/schedule/${created.id}?hostToken=${created.hostToken}`,
        hostToken: created.hostToken,
      },
      { status: 201 },
    );

    const isProd =
      process.env.NODE_ENV === "production" && process.env.E2E_TEST !== "true";
    response.cookies.set(
      getHostTokenCookieName(created.id),
      created.hostToken,
      {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "lax" : undefined,
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
