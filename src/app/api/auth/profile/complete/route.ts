import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { normalizePhoneNumber } from "@/features/auth/signup.schema";
import { socialProfileSchema } from "@/features/auth/social-profile.schema";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "인증이 필요합니다." },
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
    const now = new Date().toISOString();
    const supabase = await createClient();

    const { data: profile, error: updateError } = await supabase
      .from("profiles")
      .update({
        phone_number: normalizePhoneNumber(phoneNumber),
        is_age_over_14: isAgeOver14,
        terms_agreed_at: termsAgreed ? now : null,
        privacy_agreed_at: privacyAgreed ? now : null,
        marketing_agreed: marketingAgreed,
        event_sms_agreed: eventSmsAgreed,
      })
      .eq("id", session.userId)
      .select()
      .maybeSingle();

    if (updateError) {
      if (
        updateError.code === "23505" ||
        /unique|duplicate/i.test(updateError.message)
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
      throw updateError;
    }

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "사용자를 찾을 수 없습니다." },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "추가 정보 입력이 완료되었습니다.",
      user: {
        id: profile.id,
        email: profile.email,
        phoneNumber: profile.phone_number,
        nickname: profile.nickname,
      },
    });
  } catch (err) {
    console.error("[auth.profile.complete] error:", err);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
