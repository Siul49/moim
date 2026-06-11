import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // 개발 모드와 E2E 테스트 모드에서만 동작하도록 가드 처리
  if (
    process.env.NODE_ENV !== "development" &&
    process.env.E2E_TEST !== "true"
  ) {
    return NextResponse.json(
      { success: false, message: "접근 권한이 없습니다." },
      { status: 403 },
    );
  }

  let body: { role?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const role = body.role || "admin";
  let email = "admin@moim.com";
  let nickname = "관리자";
  let phoneNumber = "010-0000-0000";

  if (role === "host") {
    email = "host@moim.com";
    nickname = "호스트";
    phoneNumber = "010-1111-1111";
  }

  try {
    // 1. 기존 유저가 있는지 확인
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // 2. 존재하지 않으면 자동 회원 생성 (DB 싱크)
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          nickname,
          phoneNumber,
          passwordHash: "$2a$10$abcdefghijklmnopqrstuv", // Dummy hash
          isAgeOver14: true,
          termsAgreedAt: new Date(),
          privacyAgreedAt: new Date(),
          marketingAgreed: false,
          eventSmsAgreed: false,
        },
      });
    }

    const res = NextResponse.json(
      {
        success: true,
        message: `${nickname} 계정으로 우회 로그인되었습니다.`,
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
        },
      },
      { status: 200 },
    );

    // E2E / Mock 쿠키 세션 주입
    res.cookies.set("e2e_mock_uid", user.id, {
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    res.cookies.set("e2e_mock_email", user.email || "", {
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    res.cookies.set("e2e_mock_nickname", user.nickname, {
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    res.cookies.set("last_login_provider", "local", {
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return res;
  } catch (err) {
    console.error("[dev-bypass] 서버 에러:", err);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
