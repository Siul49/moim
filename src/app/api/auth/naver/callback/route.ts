import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getNaverToken,
  getNaverUser,
  extractNaverUserInfo,
} from "@/lib/auth/naver";
import { signAccessToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "naver_oauth_state";

// 프론트 경로가 확정되면 상수로 관리
const LOGIN_SUCCESS_REDIRECT = "/";
// 네이버 신규 가입 시 phoneNumber, 약관 동의 등 추가 정보 입력 필요
const ADDITIONAL_INFO_REDIRECT = "/signup/additional-info?provider=naver";
const LOGIN_FAILURE_REDIRECT = "/login?error=naver_login_failed";

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // 네이버 인가 거부
  if (error) {
    return NextResponse.redirect(`${baseUrl}${LOGIN_FAILURE_REDIRECT}`);
  }

  // code 없음
  if (!code) {
    return NextResponse.redirect(`${baseUrl}${LOGIN_FAILURE_REDIRECT}`);
  }

  // state 파라미터 누락
  if (!state) {
    return NextResponse.redirect(`${baseUrl}${LOGIN_FAILURE_REDIRECT}`);
  }

  // CSRF 방어: state 검증
  const savedState = req.cookies.get(STATE_COOKIE)?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${baseUrl}${LOGIN_FAILURE_REDIRECT}`);
  }

  try {
    // 네이버 access_token 발급 (state도 함께 전달 — 네이버 스펙)
    const naverTokenData = await getNaverToken(code, state);

    // 네이버 사용자 정보 조회
    const naverUser = await getNaverUser(naverTokenData.access_token);

    if (!naverUser.id) {
      console.error("[auth.naver.callback] naverId가 없습니다.");
      return NextResponse.redirect(`${baseUrl}${LOGIN_FAILURE_REDIRECT}`);
    }

    const { naverId, email, nickname } = extractNaverUserInfo(naverUser);

    // naverId 기준으로 기존 사용자 조회 (SocialAccount → User)
    const socialAccount = await prisma.socialAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider: "naver",
          providerUserId: naverId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
            profileCompleted: true,
          },
        },
      },
    });

    let user: {
      id: string;
      email: string | null;
      nickname: string;
      profileCompleted: boolean;
    };

    if (socialAccount) {
      // 기존 네이버 사용자 → 로그인 처리
      user = socialAccount.user;
    } else {
      // 신규 네이버 사용자 → 계정 생성
      // 닉네임 중복 시 naverId 전체로 대체 (naverId는 전역 고유값이므로 충돌 없음)
      let finalNickname = nickname;
      const existingNick = await prisma.user.findUnique({
        where: { nickname: finalNickname },
        select: { id: true },
      });
      if (existingNick) {
        finalNickname = `naver_${naverId}`;
      }

      const newUser = await prisma.user.create({
        data: {
          email: email ?? null,
          nickname: finalNickname,
          profileCompleted: false, // phoneNumber, 약관 동의 등 추가 정보 필요
          socialAccounts: {
            create: {
              provider: "naver",
              providerUserId: naverId,
            },
          },
        },
        select: {
          id: true,
          email: true,
          nickname: true,
          profileCompleted: true,
        },
      });

      user = newUser;
    }

    // 우리 서비스 JWT 발급 (Naver access_token은 포함하지 않음)
    const token = await signAccessToken({
      userId: user.id,
      ...(user.email ? { email: user.email } : {}),
      nickname: user.nickname,
      provider: "naver",
    });

    const redirectPath = user.profileCompleted
      ? LOGIN_SUCCESS_REDIRECT
      : ADDITIONAL_INFO_REDIRECT;

    const res = NextResponse.redirect(`${baseUrl}${redirectPath}`);

    // 우리 서비스 accessToken 쿠키 설정
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });

    // 사용한 state 쿠키 삭제
    res.cookies.delete(STATE_COOKIE);

    return res;
  } catch (err) {
    console.error(
      "[auth.naver.callback] 오류:",
      err instanceof Error ? err.message : "알 수 없는 오류",
    );
    return NextResponse.redirect(`${baseUrl}${LOGIN_FAILURE_REDIRECT}`);
  }
}
