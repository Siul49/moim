/**
 * Supabase 브라우저 클라이언트.
 *
 * React 클라이언트 컴포넌트에서 현재 사용자 세션과 Supabase API에 접근할 때 사용한다.
 */

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./env";

export function createClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createBrowserClient(url, anonKey);
}
