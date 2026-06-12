import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createApiHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

export const POST = createApiHandler(
  {
    requireAuth: true,
  },
  async ({ session }) => {
    const supabase = await createClient();

    // 사용자의 google_connections 데이터 영구 삭제 (Hard Delete)
    const { error } = await supabase
      .from("google_connections")
      .delete()
      .eq("profile_id", session!.userId);

    if (error) {
      console.error("[google.disconnect] DB 삭제 오류:", error.message);
      return NextResponse.json(
        { error: "연동 해제 중 오류가 발생했습니다." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  },
);
