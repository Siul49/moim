import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "요청 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const { email } = body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { success: false, message: "올바른 이메일 주소를 입력해 주세요." },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();
    const normalizedEmail = email.trim().toLowerCase();

    // 1. 해당 이메일로 가입된 유저가 profiles 테이블에 존재하는지 체크
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, message: "가입되지 않은 이메일 주소입니다." },
        { status: 404 },
      );
    }

    // 2. Supabase Auth를 이용하여 비밀번호 재설정 링크 발송
    const origin = new URL(req.url).origin;
    const redirectTo = `${origin}/reset-password/complete`;

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo,
      },
    );

    if (error) {
      console.error("[auth.forgot-password] Supabase 에러:", error.message);
      return NextResponse.json(
        {
          success: false,
          message:
            "비밀번호 재설정 메일 발송에 실패했습니다. 다시 시도해 주세요.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "비밀번호 재설정 메일이 성공적으로 전송되었습니다.",
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[auth.forgot-password] 서버 오류:", err);
    return NextResponse.json(
      { success: false, message: "서버 내부 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
