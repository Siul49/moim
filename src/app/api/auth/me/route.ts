import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createApiHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

export const GET = createApiHandler(
  { requireAuth: true },
  async ({ session }) => {
    const supabase = await createClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, nickname, phone_number")
      .eq("id", session.userId)
      .maybeSingle();

    if (profileError) throw profileError;

    return NextResponse.json({
      success: true,
      user: {
        id: session.userId,
        email: profile?.email ?? session.email,
        nickname: profile?.nickname ?? null,
        phoneNumber: profile?.phone_number ?? null,
      },
    });
  },
);
