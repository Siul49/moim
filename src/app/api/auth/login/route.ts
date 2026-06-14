import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import { createApiHandler } from "@/lib/api-handler";
import { loginSchema, isEmail } from "@/features/auth/login.schema";

export const dynamic = "force-dynamic";

const AUTH_FAIL_MESSAGE = "아이디 또는 비밀번호가 올바르지 않습니다.";

export const POST = createApiHandler(
  {
    bodySchema: loginSchema,
  },
  async ({ body }) => {
    const { loginId, password } = body;

    // Supabase signInWithPassword는 이메일을 요구한다.
    // 닉네임으로 로그인한 경우 profiles에서 이메일을 먼저 조회한다.
    let email: string | null = null;

    if (isEmail(loginId)) {
      email = loginId.trim().toLowerCase();
    } else {
      const admin = createAdminClient();
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("email")
        .eq("nickname", loginId)
        .maybeSingle();

      if (profileError) throw profileError;
      email = profile?.email ?? null;
    }

    if (!email) {
      return NextResponse.json(
        { success: false, message: AUTH_FAIL_MESSAGE },
        { status: 401 },
      );
    }

    if (process.env.E2E_TEST === "true") {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: AUTH_FAIL_MESSAGE },
          { status: 401 },
        );
      }

      const res = NextResponse.json(
        {
          success: true,
          message: "로그인에 성공했습니다. (E2E MOCK)",
          user: {
            id: user.id,
            email: user.email,
          },
        },
        { status: 200 },
      );

      res.cookies.set("e2e_mock_uid", user.id, { path: "/" });
      res.cookies.set("e2e_mock_email", user.email || "", { path: "/" });
      res.cookies.set("e2e_mock_nickname", user.nickname, { path: "/" });
      res.cookies.set("last_login_provider", "local", { path: "/" });

      return res;
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      return NextResponse.json(
        { success: false, message: AUTH_FAIL_MESSAGE },
        { status: 401 },
      );
    }

    const res = NextResponse.json(
      {
        success: true,
        message: "로그인에 성공했습니다.",
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
      { status: 200 },
    );

    const isProd =
      process.env.NODE_ENV === "production" && process.env.E2E_TEST !== "true";
    res.cookies.set("last_login_provider", "local", {
      httpOnly: false,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1년
    });

    return res;
  },
);
