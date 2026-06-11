import { NextResponse } from "next/server";
import { clearConnection } from "@/lib/caldav/connection-cookie";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // 연결 정보 쿠키를 삭제한다. 앱 전용 암호도 함께 파기된다.
    await clearConnection();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[icloud.disconnect] 예상치 못한 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
