"use client";

import { FormEvent, useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { validatePassword } from "@/features/auth/password.schema";

export default function ResetPasswordCompletePage() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [message, setMessage] = useState("");

  const [touched, setTouched] = useState({
    password: false,
    passwordConfirm: false,
  });

  const errors = {
    password:
      password && !validatePassword(password)
        ? "비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다."
        : "",
    passwordConfirm:
      passwordConfirm && password !== passwordConfirm
        ? "비밀번호가 일치하지 않습니다."
        : "",
  };

  function handleBlur(field: keyof typeof touched) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  // Supabase Auth가 hash fragment (#access_token=...)에 있는 인증 코드를 파싱하고 세션을 초기화할 수 있도록 마운트 시 대기
  useEffect(() => {
    // Supabase Client가 토큰을 브라우저에 적재할 시간을 보장
    const timer = setTimeout(async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setMessage(
            "인증 세션이 만료되었거나 올바르지 않습니다. 다시 시도해 주세요.",
          );
        }
      } catch (err) {
        console.error("세션 체크 실패:", err);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password !== passwordConfirm) {
      setMessage("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    if (errors.password) {
      setMessage("비밀번호가 안전 규격에 맞지 않습니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error(
          "비밀번호를 재설정할 권한이 없습니다. 세션이 만료되었습니다.",
        );
      }

      // API를 호출하여 SQLite DB의 유저 passwordHash를 업데이트
      const response = await fetch("/api/auth/reset-password/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message ?? "비밀번호 업데이트에 실패했습니다.");
      }

      // Supabase Auth 세션 로그아웃 처리 (로컬 자체 JWT 로그인으로 단일화하기 위함)
      await supabase.auth.signOut();

      setIsComplete(true);
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : "비밀번호 업데이트 실패",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-white px-6 py-16 text-brand-text-primary">
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-[420px] flex-col justify-center">
        <div className="mb-12 text-center">
          <Link
            href="/"
            className="text-6xl font-extrabold tracking-normal text-brand-purple"
          >
            MOIM
          </Link>
          <h1 className="mt-6 text-2xl font-extrabold">새 비밀번호 설정</h1>
          <p className="mt-3 text-base font-semibold text-brand-text-secondary">
            보안성이 우수한 새로운 비밀번호를 설정해 주세요.
          </p>
        </div>

        {isComplete ? (
          <div className="rounded-3xl border border-brand-border-muted bg-white p-8 text-center shadow-[0_20px_50px_rgba(95,82,130,0.1)]">
            <CheckCircle2 className="mx-auto h-12 w-12 text-brand-purple" />
            <h2 className="mt-5 text-xl font-extrabold">비밀번호 변경 완료</h2>
            <p className="mt-3 text-base text-brand-text-muted">
              비밀번호가 안전하게 변경되었습니다.
              <br />
              새로운 비밀번호로 로그인해 주세요.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand-purple-light font-bold text-white hover:bg-brand-purple"
            >
              로그인하러 가기
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-6">
            <label className="grid gap-2 text-lg font-bold">
              새 비밀번호
              <span className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onBlur={() => handleBlur("password")}
                  placeholder="••••••••"
                  className={`h-16 w-full rounded-lg border px-5 pr-14 text-xl font-normal outline-none focus:ring-2 ${
                    touched.password && errors.password
                      ? "border-destructive focus:border-destructive focus:ring-red-100"
                      : "border-brand-border-gray focus:border-brand-purple-light focus:ring-brand-purple-ring"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-text-light hover:text-brand-purple-light focus:outline-none"
                >
                  {showPassword ? (
                    <Eye className="h-6 w-6" />
                  ) : (
                    <EyeOff className="h-6 w-6" />
                  )}
                </button>
              </span>
              {touched.password && errors.password && (
                <span className="text-sm font-semibold text-destructive">
                  {errors.password}
                </span>
              )}
            </label>

            <label className="grid gap-2 text-lg font-bold">
              새 비밀번호 확인
              <span className="relative">
                <input
                  type={showPasswordConfirm ? "text" : "password"}
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  onBlur={() => handleBlur("passwordConfirm")}
                  placeholder="••••••••"
                  className={`h-16 w-full rounded-lg border px-5 pr-14 text-xl font-normal outline-none focus:ring-2 ${
                    touched.passwordConfirm && errors.passwordConfirm
                      ? "border-destructive focus:border-destructive focus:ring-red-100"
                      : "border-brand-border-gray focus:border-brand-purple-light focus:ring-brand-purple-ring"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-text-light hover:text-brand-purple-light focus:outline-none"
                >
                  {showPasswordConfirm ? (
                    <Eye className="h-6 w-6" />
                  ) : (
                    <EyeOff className="h-6 w-6" />
                  )}
                </button>
              </span>
              {touched.passwordConfirm && errors.passwordConfirm && (
                <span className="text-sm font-semibold text-destructive">
                  {errors.passwordConfirm}
                </span>
              )}
            </label>

            {message ? (
              <p
                role="alert"
                className="text-sm text-destructive font-semibold"
              >
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              className="mt-2 inline-flex h-14 w-full items-center justify-center rounded-xl bg-brand-purple-light px-7 text-lg font-bold text-white shadow-[0_10px_18px_rgba(98,82,172,0.22)] hover:bg-brand-purple disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting}
            >
              {isSubmitting ? "변경 중..." : "비밀번호 변경 완료"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
