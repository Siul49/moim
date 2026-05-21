import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  signupSchema,
  normalizePhoneNumber,
} from "@/features/auth/signup.schema";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "요청 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const result = signupSchema.safeParse(body);
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
    email,
    phoneNumber,
    nickname,
    password,
    isAgeOver14,
    termsAgreed,
    privacyAgreed,
    marketingAgreed,
    eventSmsAgreed,
  } = result.data;

  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const now = new Date();

  const passwordHash = await bcryptjs.hash(password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        phoneNumber: normalizedPhone,
        nickname,
        passwordHash,
        isAgeOver14,
        termsAgreedAt: termsAgreed ? now : new Date(0),
        privacyAgreedAt: privacyAgreed ? now : new Date(0),
        marketingAgreed,
        eventSmsAgreed,
      },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        nickname: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "회원가입이 완료되었습니다.",
        user,
      },
      { status: 201 },
    );
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const field = (err.meta?.target as string[] | undefined)?.[0];
      const messages: Record<string, string> = {
        email: "이미 사용 중인 이메일입니다.",
        phoneNumber: "이미 사용 중인 전화번호입니다.",
        nickname: "이미 사용 중인 닉네임입니다.",
      };
      return NextResponse.json(
        {
          success: false,
          message: messages[field ?? ""] ?? "이미 사용 중인 정보입니다.",
          field: field ?? null,
        },
        { status: 409 },
      );
    }

    console.error("[auth.signup] 서버 오류:", err);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
