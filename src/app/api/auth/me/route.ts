import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken, COOKIE_NAME } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, message: "인증이 필요합니다." },
      { status: 401 },
    );
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    return NextResponse.json(
      { success: false, message: "유효하지 않은 토큰입니다." },
      { status: 401 },
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        phoneNumber: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "사용자를 찾을 수 없습니다." },
        { status: 401 },
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("[auth.me] 서버 오류:", err);
    return NextResponse.json(
      { success: false, message: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
