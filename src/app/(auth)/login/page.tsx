"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { EyeOff, MessageCircle } from "lucide-react";
import { AuthProviderGlyph } from "@/components/moim/auth-social";

export default function LoginPage() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message ?? "로그인에 실패했습니다.");
      }
      window.location.href = "/schedule/create";
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : "요청에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setMessage("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Google 로그인을 시작할 수 없습니다.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-white px-6 py-16 text-[#222026]">
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-[420px] flex-col justify-center">
        <div className="mb-12 text-center">
          <Link
            href="/"
            className="text-6xl font-extrabold tracking-normal text-[#6252ac]"
          >
            MOIM
          </Link>
          <p className="mt-5 text-lg font-semibold text-[#6f6a73]">
            모임을 더 가깝게, 일상을 더 특별하게
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="grid gap-2 text-lg font-bold">
            이메일
            <input
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              placeholder="example@email.com"
              className="h-16 rounded-lg border border-[#dedbe3] px-5 text-xl font-normal outline-none focus:border-[#8f7bd6] focus:ring-2 focus:ring-[#ece7fb]"
              autoComplete="username"
              required
            />
          </label>
          <label className="grid gap-2 text-lg font-bold">
            <span className="flex items-center justify-between">
              비밀번호
              <Link href="/login" className="text-base text-[#6252ac]">
                비밀번호 찾기
              </Link>
            </span>
            <span className="relative">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="h-16 w-full rounded-lg border border-[#dedbe3] px-5 pr-14 text-xl font-normal outline-none focus:border-[#8f7bd6] focus:ring-2 focus:ring-[#ece7fb]"
                autoComplete="current-password"
                required
              />
              <EyeOff className="absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-[#aaa5ad]" />
            </span>
          </label>

          <label className="mt-2 flex items-center gap-3 text-lg font-semibold text-[#47434d]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-5 w-5 rounded border-[#dedbe3]"
            />
            로그인 유지
          </label>

          {message ? (
            <p role="alert" className="text-sm text-destructive">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#8f7bd6] px-7 text-base font-semibold text-white shadow-[0_10px_18px_rgba(98,82,172,0.22)] hover:bg-[#7d68c9] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
          >
            {isSubmitting ? "로그인 중" : "로그인"}
          </button>
        </form>

        <div className="my-12 flex items-center gap-6 text-lg font-semibold text-[#aaa5ad]">
          <div className="h-px flex-1 bg-[#dedbe3]" />
          또는
          <div className="h-px flex-1 bg-[#dedbe3]" />
        </div>

        <div className="grid gap-4">
          <a
            href="/api/auth/kakao/login"
            className="inline-flex h-14 items-center justify-center gap-3 rounded-lg bg-[#fee500] text-lg font-bold text-[#191919]"
          >
            <MessageCircle className="h-5 w-5" /> 카카오로 시작하기
          </a>
          <button
            type="button"
            className="inline-flex h-14 items-center justify-center gap-3 rounded-lg border border-[#dedbe3] bg-white text-lg font-bold"
            onClick={handleGoogleLogin}
          >
            <AuthProviderGlyph type="google" /> 구글로 시작하기
          </button>
          <button
            type="button"
            className="inline-flex h-14 items-center justify-center gap-3 rounded-lg bg-[#03c75a] text-lg font-bold text-white"
          >
            <AuthProviderGlyph type="naver" /> 네이버로 시작하기
          </button>
          <a
            href="/api/auth/apple/login"
            className="inline-flex h-14 items-center justify-center gap-3 rounded-lg bg-[#171717] text-lg font-bold text-white"
          >
            <AuthProviderGlyph type="apple" /> iCloud로 시작하기
          </a>
        </div>

        <p className="mt-12 text-center text-lg font-semibold text-[#6f6a73]">
          아직 계정이 없으신가요?{" "}
          <Link href="/signup" className="text-[#6252ac]">
            회원가입
          </Link>
        </p>
      </section>
    </main>
  );
}
