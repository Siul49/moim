import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // 소셜 로그인 시 profiles 자동생성 트리거(handle_new_user)가 실제 DB에
      // 적용돼 있지 않으면 profiles 행이 없어 /api/auth/me가 401을 던지고
      // 로그인 상태로 인식되지 않는다. 트리거 적용 여부와 무관하게 보장한다.
      await ensureProfile(data.user);
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // Authentication failed: redirect back to login with an error message
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}

/**
 * 소셜 로그인 사용자의 public.profiles 행을 보장한다(없을 때만 생성).
 * profiles에는 INSERT RLS 정책이 없어 일반 클라로는 불가하므로 service_role을 사용한다.
 * 이미 존재하면 덮어쓰지 않는다(사용자가 수정한 닉네임 보존).
 */
async function ensureProfile(user: User | null) {
  if (!user) return;

  try {
    const meta = user.user_metadata ?? {};
    const nickname =
      meta.full_name ||
      meta.name ||
      meta.nickname ||
      user.email?.split("@")[0] ||
      "사용자";

    const admin = createAdminClient();
    await admin.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? null,
        nickname,
        avatar_url: meta.avatar_url ?? null,
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
  } catch (err) {
    // profiles 보장 실패가 로그인 자체를 막지 않도록 무시한다.
    // (트리거가 이미 생성했을 수도 있음)
    console.error("[auth.callback] profiles 보장 실패:", err);
  }
}
