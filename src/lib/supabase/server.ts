/**
 * Supabase 서버 클라이언트 (스켈레톤)
 *
 * 서버 사이드(Next.js Server Components, API Routes)에서
 * Supabase에 접근하는 클라이언트.
 *
 * 주의: 서버에서는 NEXT_PUBLIC_ prefix가 없는 키를 사용해야 함.
 * NEXT_PUBLIC_ 변수는 클라이언트 번들에 노출되므로 보안 위험!
 *
 * TODO: Supabase URL + service role key 연결 후 구현
 */

// import { createServerClient } from '@supabase/ssr'
// import { cookies } from 'next/headers'
//
// export function createServerSupabaseClient() {
//   const cookieStore = cookies()
//   return createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.SUPABASE_SERVICE_ROLE_KEY!,  // ⚠️ NEXT_PUBLIC_ 없이! 서버 전용
//     { cookies: { ... } }
//   )
// }
