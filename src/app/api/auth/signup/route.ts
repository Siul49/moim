import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const now = new Date().toISOString();

  if (process.env.E2E_TEST === "true") {
    const mockUid = `e2e_user_${Date.now()}`;
    await prisma.user.create({
      data: {
        id: mockUid,
        email: normalizedEmail,
        phoneNumber: normalizedPhone,
        nickname,
        passwordHash: "$2a$10$abcdefghijklmnopqrstuv",
        isAgeOver14: true,
        termsAgreedAt: new Date(),
        privacyAgreedAt: new Date(),
        marketingAgreed: false,
        eventSmsAgreed: false,
      },
    });

    const res = NextResponse.json(
      {
        success: true,
        message: "회원가입이 완료되었습니다. (E2E MOCK)",
        user: { id: mockUid, email: normalizedEmail, nickname },
      },
      { status: 201 },
    );

    res.cookies.set("e2e_mock_uid", mockUid, { path: "/" });
    res.cookies.set("e2e_mock_email", normalizedEmail, { path: "/" });
    res.cookies.set("e2e_mock_nickname", nickname, { path: "/" });

    return res;
  }

  const supabase = await createClient();

  // Supabase Auth로 사용자 생성.
  // 확장 필드는 user_metadata로 전달하면 handle_new_user 트리거가
  // public.profiles에 채운다.
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        nickname,
        phone_number: normalizedPhone,
        is_age_over_14: isAgeOver14,
        terms_agreed_at: termsAgreed ? now : null,
        privacy_agreed_at: privacyAgreed ? now : null,
        marketing_agreed: marketingAgreed,
        event_sms_agreed: eventSmsAgreed,
      },
    },
  });

  if (error) {
    // 중복 가입(이미 등록된 이메일/닉네임/전화) 및 프로필 트리거 unique 위반.
    // Supabase 에러 메시지 문구 변경에 취약하지 않도록 구조화된 status를 우선 사용하고,
    // 없을 때만 메시지 정규식으로 fallback한다.
    const status =
      error.status === 409 ||
      /already|registered|exists|duplicate|unique/i.test(error.message)
        ? 409
        : 400;
    const message =
      status === 409
        ? "이미 사용 중인 정보입니다."
        : "회원가입에 실패했습니다. 입력 정보를 확인해주세요.";
    return NextResponse.json({ success: false, message }, { status });
  }

  const user = data.user;

  return NextResponse.json(
    {
      success: true,
      message: "회원가입이 완료되었습니다.",
      user: user ? { id: user.id, email: user.email, nickname } : null,
    },
    { status: 201 },
  );
}
