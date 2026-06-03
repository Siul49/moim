import { NextResponse } from "next/server";
import { requireSession, UnauthorizedError } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  let session;
  try {
    session = await requireSession();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 },
      );
    }
    throw e;
  }

  try {
    const supabase = await createClient();

    // 사용자의 icloud_connections 데이터 영구 삭제 (Hard Delete)
    // 외래키 cascade 설정에 의해 관련 icloud_calendars 레코드도 함께 지워집니다.
    const { error } = await supabase
      .from("icloud_connections")
      .delete()
      .eq("profile_id", session.userId);

    if (error) {
      console.error("[icloud.disconnect] DB 삭제 오류:", error.message);
      return NextResponse.json(
        { error: "연동 해제 중 오류가 발생했습니다." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[icloud.disconnect] 예상치 못한 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
