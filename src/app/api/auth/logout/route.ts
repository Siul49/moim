import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createApiHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

export const POST = createApiHandler({}, async () => {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[auth.logout] signOut 오류:", error);
  }

  return NextResponse.json(
    { success: true, message: "로그아웃되었습니다." },
    { status: 200 },
  );
});
