import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "요청 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const { password } = body;
  if (
    !password ||
    password.length < 8 ||
    !/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':",./<>?]).{8,}$/.test(
      password,
    )
  ) {
    return NextResponse.json(
      {
        success: false,
        message:
          "비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다.",
      },
      { status: 400 },
    );
  }

  // 1. Authorization 헤더로부터 Bearer 토큰 추출
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, message: "인증 정보가 누락되었습니다." },
      { status: 401 },
    );
  }
  const token = authHeader.split(" ")[1];

  try {
    // 2. Supabase Auth를 통해 토큰으로 세션을 설정하고 비밀번호 변경
    const supabase = await createClient();
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: "",
    });

    if (sessionError) {
      console.error(
        "[auth.reset-password.complete] setSession 에러:",
        sessionError.message,
      );
      return NextResponse.json(
        {
          success: false,
          message: "유효하지 않거나 만료된 세션입니다. 다시 시도해 주세요.",
        },
        { status: 401 },
      );
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      console.error(
        "[auth.reset-password.complete] updateUser 에러:",
        updateError.message,
      );
      return NextResponse.json(
        {
          success: false,
          message: "비밀번호 변경에 실패했습니다. 다시 시도해 주세요.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, message: "비밀번호가 성공적으로 변경되었습니다." },
      { status: 200 },
    );
  } catch (err) {
    console.error("[auth.reset-password.complete] 서버 오류:", err);
    return NextResponse.json(
      { success: false, message: "서버 내부 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
