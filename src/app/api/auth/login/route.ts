import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/auth/password";
import { signAccessToken, COOKIE_NAME } from "@/lib/auth/jwt";
import { loginSchema, isEmail } from "@/features/auth/login.schema";

export const dynamic = "force-dynamic";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7일
const AUTH_FAIL_MESSAGE = "아이디 또는 비밀번호가 올바르지 않습니다.";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "요청 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const result = loginSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const { loginId, password } = result.data;

  try {
    const where = isEmail(loginId)
      ? { email: loginId.trim().toLowerCase() }
      : { nickname: loginId };

    const user = await prisma.user.findUnique({
      where,
      select: {
        id: true,
        email: true,
        nickname: true,
        phoneNumber: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: AUTH_FAIL_MESSAGE },
        { status: 401 },
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: AUTH_FAIL_MESSAGE },
        { status: 401 },
      );
    }

    const token = await signAccessToken({
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
    });

    const res = NextResponse.json(
      {
        success: true,
        message: "로그인에 성공했습니다.",
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          phoneNumber: user.phoneNumber,
        },
      },
      { status: 200 },
    );

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });

    return res;
  } catch (err) {
    console.error("[auth.login] 서버 오류:", err);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
