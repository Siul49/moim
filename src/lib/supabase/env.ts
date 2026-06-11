export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (typeof window !== "undefined" && !process.env.VITEST) {
    url ||= "https://example-project.supabase.co";
    anonKey ||= "test-anon-key";
  }

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL 환경변수가 설정되지 않았습니다.");
  }

  if (!anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다.",
    );
  }

  return { url, anonKey };
}
