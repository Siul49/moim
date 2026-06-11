/**
 * Supabase 관리자(service role) 클라이언트
 *
 * service_role 키를 사용하므로 RLS를 우회한다. 절대 클라이언트(브라우저)로
 * 노출하면 안 되며, 서버 사이드(Route Handler)에서만 사용한다.
 *
 * 용도:
 * - 로그인 시 닉네임 → 이메일 조회 (세션 없이 profiles 읽기)
 * - 그 외 인증 부수 처리
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase 관리자 클라이언트 설정이 누락되었습니다 (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return cached;
}
