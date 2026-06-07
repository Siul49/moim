import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginSchema, isEmail } from "@/features/auth/login.schema";

export const dynamic = "force-dynamic";

const AUTH_FAIL_MESSAGE = "아이디 또는 비밀번호가 올바르지 않습니다.";

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

  const result = loginSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const { loginId, password } = result.data;

  try {
    // Supabase signInWithPassword는 이메일을 요구한다.
    // 닉네임으로 로그인한 경우 profiles에서 이메일을 먼저 조회한다.
    let email: string | null = null;

    if (isEmail(loginId)) {
      email = loginId.trim().toLowerCase();
    } else {
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from("profiles")
        .select("email")
        .eq("nickname", loginId)
        .maybeSingle();
      email = profile?.email ?? null;
    }

    if (!email) {
      return NextResponse.json(
        { success: false, message: AUTH_FAIL_MESSAGE },
        { status: 401 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { success: false, message: AUTH_FAIL_MESSAGE },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "로그인에 성공했습니다.",
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[auth.login] 서버 오류:", err);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
