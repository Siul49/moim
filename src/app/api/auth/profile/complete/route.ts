import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createApiHandler } from "@/lib/api-handler";
import { normalizePhoneNumber } from "@/features/auth/signup.schema";
import { socialProfileSchema } from "@/features/auth/social-profile.schema";

export const dynamic = "force-dynamic";

export const POST = createApiHandler(
  {
    requireAuth: true,
    bodySchema: socialProfileSchema,
  },
  async ({ session, body }) => {
    const {
      phoneNumber,
      isAgeOver14,
      termsAgreed,
      privacyAgreed,
      marketingAgreed,
      eventSmsAgreed,
    } = body;

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
  },
);
