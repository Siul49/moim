import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    // 세션 정리 실패는 치명적이지 않으므로 로깅 후 성공 응답을 유지한다.
    console.error("[auth.logout] signOut 오류:", error);
  }

  return NextResponse.json(
    { success: true, message: "로그아웃되었습니다." },
    { status: 200 },
  );
}
