import { NextResponse } from "next/server";
import { z } from "zod";
import {
  confirmSchedule,
  confirmScheduleByCreator,
  deleteScheduleByCreator,
  getScheduleForCreator,
  getScheduleForHost,
  getScheduleParticipantForUser,
  getScheduleResult,
} from "@/lib/schedules/store";
import {
  HOST_TOKEN_MAX_AGE,
  getHostTokenCookieName,
} from "@/lib/schedules/host-cookie";
import { createApiHandler } from "@/lib/api-handler";
import { confirmScheduleSchema } from "@/features/schedules/schedule.schema";
import type { Session } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getReadableScheduleResult(id: string, session: Session | null) {
  const participant = session
    ? await getScheduleParticipantForUser(id, session.userId)
    : null;
  const schedule = await getScheduleResult(id);

  return {
    schedule,
    hasSubmittedAvailability: Boolean(participant),
    participantName: participant?.name ?? null,
    isAuthenticated: Boolean(session),
  };
}

export const GET = createApiHandler<z.ZodTypeAny, { id: string }>(
  { loadSession: true },
  async ({ req, session, params }) => {
    const { id } = params;

    // 1. 로그인 유저가 생성자(호스트)인지 먼저 확인
    if (session) {
      const creatorSchedule = await getScheduleForCreator(id, session.userId);
      if (creatorSchedule) {
        return NextResponse.json({ schedule: creatorSchedule, isHost: true });
      }
    }

    // 2. hostToken 쿼리 파라미터 또는 쿠키 확인
    const queryHostToken = req.nextUrl.searchParams.get("hostToken");
    const cookieHostToken = req.cookies.get(getHostTokenCookieName(id))?.value;
    const hostToken = queryHostToken ?? cookieHostToken;

    if (hostToken) {
      const hostSchedule = await getScheduleForHost(id, hostToken);
      if (hostSchedule) {
        const response = NextResponse.json({
          schedule: hostSchedule,
          isHost: true,
        });
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

      // 쿠키에 담긴 토큰만 잘못된 경우: 쿠키를 소멸시키고 집계 결과(읽기전용)로 이동
      const result = await getReadableScheduleResult(id, session);
      const { schedule } = result;
      if (!schedule) {
        return NextResponse.json(
          { error: "schedule not found" },
          { status: 404 },
        );
      }
      const response = NextResponse.json({
        schedule,
        isHost: false,
        hasSubmittedAvailability: result.hasSubmittedAvailability,
        participantName: result.participantName,
        isAuthenticated: result.isAuthenticated,
      });
      response.cookies.set(getHostTokenCookieName(id), "", {
        path: "/",
        maxAge: 0,
      });
      return response;
    }

    const result = await getReadableScheduleResult(id, session);
    const { schedule } = result;
    if (!schedule) {
      return NextResponse.json(
        { error: "schedule not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      schedule,
      isHost: false,
      hasSubmittedAvailability: result.hasSubmittedAvailability,
      participantName: result.participantName,
      isAuthenticated: result.isAuthenticated,
    });
  },
);

export const PATCH = createApiHandler<
  typeof confirmScheduleSchema,
  { id: string }
>(
  {
    bodySchema: confirmScheduleSchema,
    loadSession: true,
  },
  async ({ req, session, body, params }) => {
    const { id } = params;
    const { confirmedSlot } = body;

    try {
      // 1. 로그인 유저가 생성자(호스트)인지 먼저 확인하여 확정
      if (session) {
        const isCreator = await getScheduleForCreator(id, session.userId);
        if (isCreator) {
          const schedule = await confirmScheduleByCreator(
            id,
            session.userId,
            confirmedSlot,
          );
          return NextResponse.json({ schedule });
        }
      }

      // 2. hostToken 기반 확정 처리
      const bodyHostToken = body.hostToken;
      const trimmedBodyHostToken =
        typeof bodyHostToken === "string" ? bodyHostToken.trim() : "";
      const hostToken =
        trimmedBodyHostToken ||
        req.cookies.get(getHostTokenCookieName(id))?.value;

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
      if (message === "schedule not found") {
        return NextResponse.json({ error: message }, { status: 404 });
      }
      if (message === "invalid host token") {
        return NextResponse.json({ error: message }, { status: 403 });
      }
      throw error;
    }
  },
);

// 생성자(호스트) 본인만 모임을 삭제할 수 있다. 참여자는 Cascade로 함께 삭제됨.
export const DELETE = createApiHandler<z.ZodTypeAny, { id: string }>(
  { requireAuth: true },
  async ({ session, params }) => {
    const { id } = params;

    try {
      // requireAuth: true이므로 이 지점에서 session은 항상 존재한다.
      await deleteScheduleByCreator(id, session!.userId);
      return NextResponse.json({ success: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "invalid request";
      if (message === "schedule not found") {
        return NextResponse.json({ error: message }, { status: 404 });
      }
      if (message === "forbidden") {
        return NextResponse.json(
          { error: "삭제 권한이 없습니다." },
          { status: 403 },
        );
      }
      throw error;
    }
  },
);
