import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  APPLE_STATE_COOKIE,
  type AppleIdentity,
  buildAppleNickname,
  exchangeAppleCodeForToken,
  extractAppleIdentity,
} from "@/lib/auth/apple";
import { signAccessToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

const LOGIN_SUCCESS_REDIRECT = "/";
const ADDITIONAL_INFO_REDIRECT = "/signup/additional-info?provider=apple";
const LOGIN_FAILURE_REDIRECT = "/login?error=apple_login_failed";

interface AppleCallbackInput {
  code?: string | null;
  state?: string | null;
  idToken?: string | null;
  user?: string | null;
  error?: string | null;
}

type AuthenticatedUser = {
  id: string;
  email: string | null;
  nickname: string;
  profileCompleted: boolean;
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  return handleAppleCallback(req, {
    code: searchParams.get("code"),
    state: searchParams.get("state"),
    idToken: searchParams.get("id_token"),
    user: searchParams.get("user"),
    error: searchParams.get("error"),
  });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  return handleAppleCallback(req, {
    code: asString(formData.get("code")),
    state: asString(formData.get("state")),
    idToken: asString(formData.get("id_token")),
    user: asString(formData.get("user")),
    error: asString(formData.get("error")),
  });
}

async function handleAppleCallback(
  req: NextRequest,
  input: AppleCallbackInput,
) {
  const baseUrl = req.nextUrl.origin;

  if (input.error || !input.code || !input.state) {
    return NextResponse.redirect(`${baseUrl}${LOGIN_FAILURE_REDIRECT}`);
  }

  const savedState = req.cookies.get(APPLE_STATE_COOKIE)?.value;
  if (!savedState || savedState !== input.state) {
    return NextResponse.redirect(`${baseUrl}${LOGIN_FAILURE_REDIRECT}`);
  }

  try {
    const tokenData = input.idToken
      ? null
      : await exchangeAppleCodeForToken(input.code, baseUrl);
    const idToken = input.idToken ?? tokenData?.id_token;
    if (!idToken) {
      throw new Error("Apple id_token is missing.");
    }

    const identity = extractAppleIdentity(idToken, input.user);
    const user = await findOrCreateAppleUser(identity);
    const token = await signAccessToken({
      userId: user.id,
      ...(user.email ? { email: user.email } : {}),
      nickname: user.nickname,
      provider: "apple",
    });

    const redirectPath = user.profileCompleted
      ? LOGIN_SUCCESS_REDIRECT
      : ADDITIONAL_INFO_REDIRECT;
    const res = NextResponse.redirect(`${baseUrl}${redirectPath}`);

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
    res.cookies.delete(APPLE_STATE_COOKIE);

    return res;
  } catch (err) {
    console.error(
      "[auth.apple.callback] error:",
      err instanceof Error ? err.message : "unknown error",
    );
    return NextResponse.redirect(`${baseUrl}${LOGIN_FAILURE_REDIRECT}`);
  }
}

async function findOrCreateAppleUser(
  identity: AppleIdentity,
): Promise<AuthenticatedUser> {
  const socialAccount = await prisma.socialAccount.findUnique({
    where: {
      provider_providerUserId: {
        provider: "apple",
        providerUserId: identity.subject,
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

  if (socialAccount) return socialAccount.user;

  const existingUser = identity.email
    ? await prisma.user.findUnique({
        where: { email: identity.email },
        select: {
          id: true,
          email: true,
          nickname: true,
          profileCompleted: true,
        },
      })
    : null;

  if (existingUser) {
    await prisma.socialAccount.create({
      data: {
        userId: existingUser.id,
        provider: "apple",
        providerUserId: identity.subject,
      },
    });
    return existingUser;
  }

  const nickname = await resolveUniqueAppleNickname(identity);
  return prisma.user.create({
    data: {
      email: identity.email ?? null,
      nickname,
      profileCompleted: false,
      socialAccounts: {
        create: {
          provider: "apple",
          providerUserId: identity.subject,
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
}

async function resolveUniqueAppleNickname(identity: AppleIdentity) {
  const candidate = buildAppleNickname(identity);
  const existingNickname = await prisma.user.findUnique({
    where: { nickname: candidate },
    select: { id: true },
  });

  return existingNickname ? `apple_${identity.subject}` : candidate;
}

function asString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : null;
}
