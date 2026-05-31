import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  extractNaverUserInfo,
  getNaverToken,
  getNaverUser,
} from "@/lib/auth/naver";
import { COOKIE_MAX_AGE, COOKIE_NAME, signAccessToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "naver_oauth_state";
const LOGIN_SUCCESS_REDIRECT = "/";
const ADDITIONAL_INFO_REDIRECT = "/signup/additional-info?provider=naver";
const LOGIN_FAILURE_REDIRECT = "/login?error=naver_login_failed";

function redirectWithStateCleanup(origin: string, path: string) {
  const res = NextResponse.redirect(`${origin}${path}`);
  res.cookies.delete(STATE_COOKIE);
  return res;
}

function isUniqueConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function uniqueTargetIncludes(
  error: Prisma.PrismaClientKnownRequestError,
  field: string,
) {
  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.includes(field);
  }
  return typeof target === "string" && target.includes(field);
}

export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !state) {
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
      user = socialAccount.user;
    } else {
      let finalNickname = nickname;
      const existingNick = await prisma.user.findUnique({
        where: { nickname: finalNickname },
        select: { id: true },
      });
      if (existingNick) {
        finalNickname = `naver_${naverId}`;
      }

      const createUserData = (nick: string) => ({
        data: {
          email: email ?? null,
          nickname: nick,
          profileCompleted: false,
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

      try {
        user = await prisma.user.create(createUserData(finalNickname));
      } catch (createErr) {
        if (!isUniqueConstraintError(createErr)) {
          throw createErr;
        }

        if (
          uniqueTargetIncludes(createErr, "provider") ||
          uniqueTargetIncludes(createErr, "providerUserId")
        ) {
          const racedSocialAccount = await prisma.socialAccount.findUnique({
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
          if (!racedSocialAccount) {
            throw createErr;
          }
          user = racedSocialAccount.user;
        } else if (uniqueTargetIncludes(createErr, "nickname")) {
          const randomSuffix = Math.random().toString(36).slice(2, 7);
          user = await prisma.user.create(
            createUserData(`naver_${naverId}_${randomSuffix}`),
          );
        } else {
          throw createErr;
        }
      }
    }

    const token = await signAccessToken({
      userId: user.id,
      ...(user.email ? { email: user.email } : {}),
      nickname: user.nickname,
      provider: "naver",
    });

    const redirectPath = user.profileCompleted
      ? LOGIN_SUCCESS_REDIRECT
      : ADDITIONAL_INFO_REDIRECT;

    const res = NextResponse.redirect(`${origin}${redirectPath}`);
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
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
