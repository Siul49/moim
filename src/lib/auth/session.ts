import { createClient } from "@/shared/lib/supabase/server";

export interface Session {
  userId: string; // auth.users.id (= profiles.id for authenticated users)
  email: string;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("인증이 필요합니다.");
    this.name = "UnauthorizedError";
  }
}

/** 현재 Supabase 세션을 반환한다. 로그인하지 않은 경우 null. */
export async function getSession(): Promise<Session | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) return null;

  return { userId: user.id, email: user.email };
}

/**
 * 현재 세션을 반환한다. 로그인하지 않은 경우 UnauthorizedError를 던진다.
 * Route Handler에서 인증 게이트로 사용한다.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session;
}
