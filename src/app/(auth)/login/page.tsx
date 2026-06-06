"use client";

import { FormEvent, useState, useEffect } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { AuthProviderGlyph } from "@/components/moim/auth-social";

export default function LoginPage() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [mounted, setMounted] = useState(false);
  const [lastProvider, setLastProvider] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const cookies = document.cookie.split("; ");
    const providerCookie = cookies.find((row) =>
      row.startsWith("last_login_provider="),
    );
    if (providerCookie) {
      setLastProvider(providerCookie.split("=")[1]);
    }
  }, []);

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    if (event) event.preventDefault();
    if (isSubmitting) return;
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password, remember }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message ?? "로그인에 실패했습니다.");
      }

      // Webkit/Safari 쿠키 디스크 동기화 대기 시간 부여
      await new Promise((resolve) => setTimeout(resolve, 2000));

      window.location.href = "/schedule/create";
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : "요청에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGoogleLogin() {
    window.location.href = "/api/auth/google/login";
  }

  return (
    <main className="min-h-screen bg-white px-6 py-16 text-[#222026]">
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-[480px] flex-col justify-center">
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

        <form onSubmit={(e) => e.preventDefault()} className="grid gap-3.5">
          <label htmlFor="loginId" className="grid gap-1.5 text-base font-bold">
            이메일
            <input
              id="loginId"
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              placeholder="example@email.com"
              className="moim-input"
              autoComplete="username"
              required
            />
          </label>
          <label
            htmlFor="password"
            className="grid gap-1.5 text-base font-bold"
          >
            <span className="flex items-center justify-between">
              비밀번호
              <Link
                href="/forgot-password"
                className="text-sm text-brand-purple hover:underline"
              >
                비밀번호 찾기
              </Link>
            </span>
            <span className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="moim-input pr-12"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#aaa5ad] hover:text-brand-purple-accent focus:outline-none"
              >
                {showPassword ? (
                  <Eye className="h-5 w-5" />
                ) : (
                  <EyeOff className="h-5 w-5" />
                )}
              </button>
            </span>
          </label>

          <label className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#47434d]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4.5 w-4.5 rounded border-brand-border-gray accent-brand-purple"
            />
            로그인 유지
          </label>

          {message ? (
            <p role="alert" className="text-sm text-destructive">
              {message}
            </p>
          ) : null}

          <div className="relative w-full">
            <button
              type="button"
              onClick={() => handleSubmit()}
              className={`mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand-purple-accent px-7 text-base font-semibold text-white shadow-sm hover:bg-brand-purple-hover ${
                isSubmitting ? "cursor-not-allowed opacity-70" : ""
              }`}
            >
              {isSubmitting ? "로그인 중" : "로그인"}
            </button>
            {mounted && lastProvider === "local" && (
              <span className="absolute top-1.5 -right-2 flex h-5 items-center rounded-full bg-[#7048e8] px-2.5 text-xs font-bold text-white shadow-sm animate-bounce">
                최근 사용
              </span>
            )}
          </div>
        </form>

        <div className="my-6 flex items-center gap-6 text-sm font-semibold text-[#aaa5ad]">
          <div className="h-px flex-1 bg-brand-border-gray" />
          또는
          <div className="h-px flex-1 bg-brand-border-gray" />
        </div>

        <div className="grid gap-3.5">
          <a
            href="/api/auth/kakao/login"
            className="relative inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-[#fee500] text-lg font-bold text-[#191919] transition-all hover:opacity-90 active:scale-[0.99]"
          >
            <AuthProviderGlyph type="kakao" className="h-5 w-5" /> 카카오로
            시작하기
            {mounted && lastProvider === "kakao" && (
              <span className="absolute -top-2 -right-2 flex h-5 items-center rounded-full bg-[#7048e8] px-2.5 text-xs font-bold text-white shadow-sm animate-bounce">
                최근 사용
              </span>
            )}
          </a>
          <button
            type="button"
            className="relative inline-flex h-14 items-center justify-center gap-3 rounded-xl border border-[#dedbe3] bg-white text-lg font-bold text-[#3c4043] transition-all hover:bg-[#f8f9fa] active:scale-[0.99] shadow-sm"
            onClick={handleGoogleLogin}
          >
            <AuthProviderGlyph type="google" className="h-5 w-5" /> 구글로
            시작하기
            {mounted && lastProvider === "google" && (
              <span className="absolute -top-2 -right-2 flex h-5 items-center rounded-full bg-[#7048e8] px-2.5 text-xs font-bold text-white shadow-sm animate-bounce">
                최근 사용
              </span>
            )}
          </button>
          <a
            href="/api/auth/naver/login"
            className="relative inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-[#03c75a] text-lg font-bold text-white transition-all hover:opacity-90 active:scale-[0.99]"
          >
            <AuthProviderGlyph type="naver" className="h-5 w-5" /> 네이버로
            시작하기
            {mounted && lastProvider === "naver" && (
              <span className="absolute -top-2 -right-2 flex h-5 items-center rounded-full bg-[#7048e8] px-2.5 text-xs font-bold text-white shadow-sm animate-bounce">
                최근 사용
              </span>
            )}
          </a>
          <a
            href="/api/auth/apple/login"
            className="relative inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-black text-lg font-bold text-white transition-all hover:bg-[#1c1c1e] active:scale-[0.99]"
          >
            <AuthProviderGlyph type="apple" className="h-5 w-5" /> Apple로
            시작하기
            {mounted && lastProvider === "apple" && (
              <span className="absolute -top-2 -right-2 flex h-5 items-center rounded-full bg-[#7048e8] px-2.5 text-xs font-bold text-white shadow-sm animate-bounce">
                최근 사용
              </span>
            )}
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
