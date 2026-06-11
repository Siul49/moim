import { NextRequest, NextResponse } from "next/server";
import {
  extractNaverUserInfo,
  getNaverToken,
  getNaverUser,
} from "@/lib/auth/naver";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "naver_oauth_state";
const ADDITIONAL_INFO_REDIRECT = "/signup/additional-info?provider=naver";
const LOGIN_SUCCESS_REDIRECT = "/schedule/create";
const LOGIN_FAILURE_REDIRECT = "/login?error=naver_login_failed";

/**
 * 네이버는 Supabase가 기본 지원하지 않는 OAuth 제공자다(#46).
 * 그래서 네이버 OAuth로 사용자 정보만 받아온 뒤, Supabase Admin(service_role)으로
 * 해당 사용자를 auth.users에 생성/조회하고, magiclink 토큰을 verifyOtp로 교환해
 * 일반 Supabase 세션 쿠키를 발급한다. 이렇게 하면 카카오/구글/애플과 동일하게
 * supabase.auth.getUser() 기반 세션으로 일원화된다.
 */

function redirectWithStateCleanup(origin: string, path: string) {
  const res = NextResponse.redirect(`${origin}${path}`);
  res.cookies.delete(STATE_COOKIE);
  return res;
}

/** 네이버 이메일이 없을 때도 동일 사용자로 식별되도록 결정적 placeholder를 만든다. */
function resolveEmail(naverId: string, email?: string): string {
  if (email && email.trim()) return email.trim().toLowerCase();
  return `naver_${naverId}@naver.social.local`;
}

export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError || !code || !state) {
    return redirectWithStateCleanup(origin, LOGIN_FAILURE_REDIRECT);
  }

  const savedState = req.cookies.get(STATE_COOKIE)?.value;
  if (!savedState || savedState !== state) {
    return redirectWithStateCleanup(origin, LOGIN_FAILURE_REDIRECT);
  }

  try {
    const naverTokenData = await getNaverToken(code, state);
    const naverUser = await getNaverUser(naverTokenData.access_token);
    const { naverId, email, nickname } = extractNaverUserInfo(naverUser);

    const authEmail = resolveEmail(naverId, email);
    const admin = createAdminClient();

    // 1) 기존 사용자 조회 (이메일 = auth.users 식별자)
    const { data: existingProfile, error: lookupError } = await admin
      .from("profiles")
      .select("id, phone_number, terms_agreed_at")
      .eq("email", authEmail)
      .maybeSingle();
    if (lookupError) throw lookupError;

    let isNewUser = false;
    let profileComplete =
      !!existingProfile?.phone_number && !!existingProfile?.terms_agreed_at;

    // 2) 없으면 Admin으로 생성 (handle_new_user 트리거가 profiles 채움)
    if (!existingProfile) {
      // 닉네임 unique 충돌 회피: 충돌 시 naverId 기반(전역 고유)으로 대체
      let finalNickname = nickname;
      const { data: nickTaken } = await admin
        .from("profiles")
        .select("id")
        .eq("nickname", finalNickname)
        .maybeSingle();
      if (nickTaken) finalNickname = `naver_${naverId}`;

      const { error: createError } = await admin.auth.admin.createUser({
        email: authEmail,
        email_confirm: true,
        user_metadata: {
          nickname: finalNickname,
          provider: "naver",
          naver_id: naverId,
        },
      });
      // 동시 요청 등으로 이미 생성됐다면 무시하고 로그인으로 진행
      if (
        createError &&
        !/already|registered|exists/i.test(createError.message)
      ) {
        throw createError;
      }
      isNewUser = !createError;
      profileComplete = false;
    }

    // 3) magiclink 토큰 발급 → 서버 클라이언트에서 verifyOtp로 세션 쿠키 설정
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email: authEmail,
      });
    if (linkError || !linkData.properties?.hashed_token) {
      throw linkError ?? new Error("magiclink 토큰 발급 실패");
    }

    const supabase = await createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: "email",
      token_hash: linkData.properties.hashed_token,
    });
    if (verifyError) throw verifyError;

    const redirectPath =
      isNewUser || !profileComplete
        ? ADDITIONAL_INFO_REDIRECT
        : LOGIN_SUCCESS_REDIRECT;

    const res = NextResponse.redirect(`${origin}${redirectPath}`);
    res.cookies.set("last_login_provider", "naver", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1년
    });
    res.cookies.delete(STATE_COOKIE);

    return res;
  } catch (err) {
    console.error(
      "[auth.naver.callback] error:",
      err instanceof Error ? err.message : "unknown error",
    );
    return redirectWithStateCleanup(origin, LOGIN_FAILURE_REDIRECT);
  }
}
