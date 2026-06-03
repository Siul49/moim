import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // 1. Google 연동 확인
    const { data: googleConn, error: googleError } = await supabase
      .from("google_connections")
      .select("google_email")
      .eq("profile_id", session.userId)
      .eq("is_active", true)
      .maybeSingle();

    if (googleError) {
      console.error("[calendar.status] Google 조회 실패:", googleError.message);
    }

    // 2. iCloud 연동 확인
    const { data: icloudConn, error: icloudError } = await supabase
      .from("icloud_connections")
      .select("apple_id")
      .eq("profile_id", session.userId)
      .eq("is_active", true)
      .maybeSingle();

    if (icloudError) {
      console.error("[calendar.status] iCloud 조회 실패:", icloudError.message);
    }

    return NextResponse.json({
      googleConnected: !!googleConn,
      googleEmail: googleConn?.google_email ?? undefined,
      icloudConnected: !!icloudConn,
      icloudAppleId: icloudConn?.apple_id ?? undefined,
    });
  } catch (err) {
    console.error("[calendar.status] 오류 발생:", err);
    return NextResponse.json(
      { error: "연동 상태를 조회하는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
