import { NextResponse } from "next/server";
import {
  confirmSchedule,
  confirmScheduleByCreator,
  getScheduleForCreator,
  getScheduleForHost,
  getSchedulePublic,
} from "@/lib/schedules/store";
import {
  HOST_TOKEN_MAX_AGE,
  getHostTokenCookieName,
} from "@/lib/schedules/host-cookie";
import { createApiHandler } from "@/lib/api-handler";
import { confirmScheduleSchema } from "@/features/schedules/schedule.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = createApiHandler<Record<string, never>, { id: string }>(
  {},
  async ({ req, session, params }) => {
    const { id } = params;

    // 1. 로그인 유저가 생성자(호스트)인지 먼저 확인
    if (session) {
      const creatorSchedule = await getScheduleForCreator(id, session.userId);
      if (creatorSchedule) {
        return NextResponse.json({ schedule: creatorSchedule });
      }
    }

    // 2. hostToken 쿼리 파라미터 또는 쿠키 확인
    const queryHostToken = req.nextUrl.searchParams.get("hostToken");
    const cookieHostToken = req.cookies.get(getHostTokenCookieName(id))?.value;
    const hostToken = queryHostToken ?? cookieHostToken;

    if (hostToken) {
      const hostSchedule = await getScheduleForHost(id, hostToken);
      if (hostSchedule) {
        const response = NextResponse.json({ schedule: hostSchedule });
        const isProd =
          process.env.NODE_ENV === "production" &&
          process.env.E2E_TEST !== "true";
        response.cookies.set(getHostTokenCookieName(id), hostToken, {
          httpOnly: true,
          secure: isProd,
          sameSite: isProd ? "lax" : undefined,
          path: "/",
          maxAge: HOST_TOKEN_MAX_AGE,
        });
        return response;
      }

      // 쿼리 매개변수로 명시적인 잘못된 토큰을 넘긴 경우는 403 에러 반환
      if (queryHostToken) {
        return NextResponse.json(
          { error: "invalid host token" },
          { status: 403 },
        );
      }

      // 쿠키에 담긴 토큰만 잘못된 경우: 쿠키를 자동 소멸시키고 퍼블릭 모임 정보로 이동
      const schedule = await getSchedulePublic(id);
      if (!schedule) {
        return NextResponse.json(
          { error: "schedule not found" },
          { status: 404 },
        );
      }
      const response = NextResponse.json({ schedule });
      response.cookies.set(getHostTokenCookieName(id), "", {
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    const schedule = await getSchedulePublic(id);
    if (!schedule) {
      return NextResponse.json(
        { error: "schedule not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ schedule });
  },
);

export const PATCH = createApiHandler<
  typeof confirmScheduleSchema,
  { id: string }
>(
  {
    bodySchema: confirmScheduleSchema,
  },
  async ({ req, session, body, params }) => {
    const { id } = params;
    const { confirmedSlot } = body;

    try {
      // 1. 로그인 유저가 생성자(호스트)인지 먼저 확인하여 확정
      if (session) {
        const schedule = await confirmScheduleByCreator(
          id,
          session.userId,
          confirmedSlot,
        );
        return NextResponse.json({ schedule });
      }

      // 2. hostToken 기반 확정 처리
      const hostToken =
        typeof body.hostToken === "string" && body.hostToken.trim()
          ? body.hostToken
          : req.cookies.get(getHostTokenCookieName(id))?.value;
      if (!hostToken) {
        return NextResponse.json(
          { error: "hostToken is required" },
          { status: 400 },
        );
      }

      const schedule = await confirmSchedule(id, hostToken, confirmedSlot);
      return NextResponse.json({ schedule });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "invalid request";
      const status =
        message === "schedule not found"
          ? 404
          : message === "invalid host token"
            ? 403
            : 400;
      return NextResponse.json({ error: message }, { status });
    }
  },
);
