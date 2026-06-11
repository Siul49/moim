import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, message: "인증이 필요합니다." },
      { status: 401 },
    );
  }

  try {
    const supabase = await createClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, nickname, phone_number")
      .eq("id", session.userId)
      .maybeSingle();
    // DB 오류를 폴백값으로 가리지 않고 500으로 surface한다.
    if (profileError) throw profileError;

    return NextResponse.json({
      success: true,
      user: {
        id: session.userId,
        email: profile?.email ?? session.email,
        nickname: profile?.nickname ?? null,
        phoneNumber: profile?.phone_number ?? null,
      },
    });
  } catch (err) {
    console.error("[auth.me] 서버 오류:", err);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
