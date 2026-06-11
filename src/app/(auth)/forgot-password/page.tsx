"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message ?? "요청 처리에 실패했습니다.");
      }
      setIsSent(true);
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : "요청에 실패했습니다.",
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
          <h1 className="mt-6 text-2xl font-extrabold">비밀번호 찾기</h1>
          <p className="mt-3 text-base font-semibold text-brand-text-secondary">
            가입하신 이메일 주소를 입력해 주시면
            <br />
            비밀번호 재설정 메일을 보내드립니다.
          </p>
        </div>

        {isSent ? (
          <div className="rounded-3xl border border-brand-border-muted bg-white p-8 text-center shadow-[0_20px_50px_rgba(95,82,130,0.1)]">
            <CheckCircle2 className="mx-auto h-12 w-12 text-brand-purple" />
            <h2 className="mt-5 text-xl font-extrabold">이메일 발송 완료</h2>
            <p className="mt-3 text-base text-brand-text-muted">
              <strong className="text-brand-purple">{email}</strong>(으)로
              <br />
              비밀번호 재설정 링크를 전송했습니다.
              <br />
              메일함의 링크를 통해 비밀번호를 변경해 주세요.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand-purple-light font-bold text-white hover:bg-brand-purple"
            >
              로그인 화면으로 이동
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-6">
            <label className="grid gap-2 text-lg font-bold">
              이메일 주소
              <span className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="example@email.com"
                  className="h-16 w-full rounded-lg border border-brand-border-gray px-5 pl-12 text-xl font-normal outline-none focus:border-brand-purple-light focus:ring-2 focus:ring-brand-purple-ring"
                  required
                />
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-text-light" />
              </span>
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
              {isSubmitting ? "메일 전송 중..." : "재설정 링크 보내기"}
            </button>

            <Link
              href="/login"
              className="mt-4 text-center text-base font-semibold text-brand-text-secondary hover:text-brand-purple"
            >
              로그인 화면으로 돌아가기
            </Link>
          </form>
        )}
      </section>
    </main>
  );
}
