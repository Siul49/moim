import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { COOKIE_NAME, verifyAccessToken } from "@/lib/auth/jwt";
import { normalizePhoneNumber } from "@/features/auth/signup.schema";
import { socialProfileSchema } from "@/features/auth/social-profile.schema";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, message: "인증이 필요합니다." },
      { status: 401 },
    );
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    return NextResponse.json(
      { success: false, message: "유효하지 않은 토큰입니다." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "요청 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const result = socialProfileSchema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return NextResponse.json(
      {
        success: false,
        message: firstError.message,
        field: firstError.path[0] ?? null,
      },
      { status: 422 },
    );
  }

  const {
    phoneNumber,
    isAgeOver14,
    termsAgreed,
    privacyAgreed,
    marketingAgreed,
    eventSmsAgreed,
  } = result.data;

  try {
    const now = new Date();
    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        phoneNumber: normalizePhoneNumber(phoneNumber),
        isAgeOver14,
        termsAgreedAt: termsAgreed ? now : new Date(0),
        privacyAgreedAt: privacyAgreed ? now : new Date(0),
        marketingAgreed,
        eventSmsAgreed,
        profileCompleted: true,
      },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        nickname: true,
        profileCompleted: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "추가 정보 입력이 완료되었습니다.",
      user,
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "이미 사용 중인 전화번호입니다.",
          field: "phoneNumber",
        },
        { status: 409 },
      );
    }

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json(
        { success: false, message: "사용자를 찾을 수 없습니다." },
        { status: 401 },
      );
    }

    console.error("[auth.profile.complete] error:", err);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
