import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.json(
    { success: true, message: "로그아웃되었습니다." },
    { status: 200 },
  );
}
