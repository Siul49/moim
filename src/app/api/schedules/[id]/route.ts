import { NextRequest, NextResponse } from "next/server";
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
import { createClient } from "@/lib/supabase/server";
import type { TimeSlot } from "@/types/schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // 1. 로그인 유저가 생성자(호스트)인지 먼저 확인
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const creatorSchedule = await getScheduleForCreator(id, user.id);
      if (creatorSchedule) {
        return NextResponse.json({ schedule: creatorSchedule });
      }
    }
  } catch (err) {
    console.error("[GET schedule] 세션 확인 실패:", err);
  }

  // 2. hostToken 쿼리 파라미터 또는 쿠키 확인
  const queryHostToken = request.nextUrl.searchParams.get("hostToken");
  const cookieHostToken = request.cookies.get(
    getHostTokenCookieName(id),
  )?.value;
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
    if (!isTimeSlot(body.confirmedSlot)) {
      return NextResponse.json(
        { error: "confirmedSlot is required" },
        { status: 400 },
      );
    }

    // 1. 로그인 유저가 생성자(호스트)인지 먼저 확인하여 확정
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const schedule = await confirmScheduleByCreator(
          id,
          user.id,
          body.confirmedSlot,
        );
        return NextResponse.json({ schedule });
      }
    } catch (err) {
      console.error("[PATCH schedule] 세션 기반 확정 실패:", err);
    }

    // 2. hostToken 기반 확정 처리
    const hostToken =
      typeof body.hostToken === "string" && body.hostToken.trim()
        ? body.hostToken
        : request.cookies.get(getHostTokenCookieName(id))?.value;
    if (!hostToken) {
      return NextResponse.json(
        { error: "hostToken is required" },
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
