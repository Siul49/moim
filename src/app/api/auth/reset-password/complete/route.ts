import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import bcryptjs from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "요청 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const { password } = body;
  if (
    !password ||
    password.length < 8 ||
    !/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':",./<>?]).{8,}$/.test(
      password,
    )
  ) {
    return NextResponse.json(
      {
        success: false,
        message:
          "비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다.",
      },
      { status: 400 },
    );
  }

  // 1. Authorization 헤더로부터 Bearer 토큰 추출
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, message: "인증 정보가 누락되었습니다." },
      { status: 401 },
    );
  }
  const token = authHeader.split(" ")[1];

  try {
    // 2. Supabase Auth를 통해 토큰의 진위 확인 및 유저 이메일 획득
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user || !user.email) {
      console.error(
        "[auth.reset-password.complete] Supabase 세션 에러:",
        error?.message,
      );
      return NextResponse.json(
        {
          success: false,
          message: "유효하지 않거나 만료된 세션입니다. 다시 시도해 주세요.",
        },
        { status: 401 },
      );
    }

    // 3. 로컬 DB의 해당 유저 passwordHash 갱신
    const email = user.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "해당 계정을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const passwordHash = await bcryptjs.hash(password, 12);

    await prisma.user.update({
      where: { id: existingUser.id },
      data: { passwordHash },
    });

    return NextResponse.json(
      { success: true, message: "비밀번호가 성공적으로 변경되었습니다." },
      { status: 200 },
    );
  } catch (err) {
    console.error("[auth.reset-password.complete] 서버 오류:", err);
    return NextResponse.json(
      { success: false, message: "서버 내부 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
