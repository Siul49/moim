import { NextResponse } from "next/server";
import { createSchedule, getSchedulePublic } from "@/lib/schedules/store";
import { createApiHandler } from "@/lib/api-handler";
import { createScheduleSchema } from "@/features/schedules/schedule.schema";
import {
  HOST_TOKEN_MAX_AGE,
  getHostTokenCookieName,
} from "@/lib/schedules/host-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = createApiHandler(
  {
    bodySchema: createScheduleSchema,
    loadSession: true,
  },
  async ({ session, body }) => {
    const created = await createSchedule({
      ...body,
      creatorId: session?.userId || null,
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
  },
);
