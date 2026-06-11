"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Eye, EyeOff } from "lucide-react";
import { AuthProviderGlyph } from "@/components/moim/auth-social";
import { TermsModal, TermsKey } from "@/components/moim/TermsModal";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [form, setForm] = useState({
    email: "",
    phoneNumber: "",
    nickname: "",
    password: "",
    passwordConfirm: "",
    isAgeOver14: false,
    termsAgreed: false,
    privacyAgreed: false,
    marketingAgreed: false,
    eventSmsAgreed: false,
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [activeTermsKey, setActiveTermsKey] = useState<TermsKey | null>(null);
  const [touched, setTouched] = useState({
    email: false,
    phoneNumber: false,
    nickname: false,
    password: false,
    passwordConfirm: false,
  });

  const errors = {
    email:
      form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
        ? "올바른 이메일 형식이 아닙니다."
        : "",
    phoneNumber:
      form.phoneNumber && !/^01[016789]-?\d{3,4}-?\d{4}$/.test(form.phoneNumber)
        ? "올바른 전화번호 형식이 아닙니다. (예: 010-0000-0000)"
        : "",
    nickname:
      form.nickname && form.nickname.length < 2
        ? "닉네임은 2자 이상이어야 합니다."
        : "",
    password:
      form.password &&
      (form.password.length < 8 ||
        !/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':",./<>?]).{8,}$/.test(
          form.password,
        ))
        ? "비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다."
        : "",
    passwordConfirm:
      form.passwordConfirm && form.password !== form.passwordConfirm
        ? "비밀번호가 일치하지 않습니다."
        : "",
  };

  function handleBlur(field: keyof typeof touched) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function updateField(name: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    if (event) event.preventDefault();
    if (isSubmitting) return;
    setMessage("");
    setIsSubmitting(true);

    try {
      if (form.password !== form.passwordConfirm) {
        throw new Error("비밀번호 확인이 일치하지 않습니다.");
      }
      if (!form.isAgeOver14 || !form.termsAgreed || !form.privacyAgreed) {
        throw new Error("필수 약관에 모두 동의해 주세요.");
      }
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message ?? "회원가입에 실패했습니다.");
      }
      setIsComplete(true);
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : "요청에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-white px-6 py-14 text-brand-text-primary">
      <section className="mx-auto w-full max-w-[420px]">
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="text-6xl font-extrabold tracking-normal text-brand-purple"
          >
            MOIM
          </Link>
          <p className="mt-4 text-lg font-semibold text-brand-text-secondary">
            모임을 더 가깝게, 일상을 더 특별하게
          </p>
        </div>

        {isComplete ? (
          <div className="rounded-[2rem] border border-brand-border-muted bg-white p-10 text-center shadow-[0_20px_60px_rgba(95,82,130,0.12)]">
            <CheckCircle2 className="mx-auto h-14 w-14 text-brand-purple" />
            <h1 className="mt-5 text-3xl font-extrabold">회원가입 완료</h1>
            <p className="mt-3 text-brand-text-muted">
              이제 캘린더를 연동하거나 바로 모임을 만들 수 있습니다.
            </p>
            <div className="mt-8 grid gap-3">
              {(() => {
                let redirectUrl = "";
                if (typeof window !== "undefined") {
                  const params = new URLSearchParams(window.location.search);
                  const next = params.get("redirect") ?? params.get("next");
                  if (next && (next.startsWith("/") || !next.includes("://"))) {
                    redirectUrl = next;
                  }
                }
                if (redirectUrl) {
                  return (
                    <Link
                      href={redirectUrl}
                      className="inline-flex h-12 items-center justify-center rounded-xl bg-brand-purple font-bold text-white transition-all hover:scale-[1.02]"
                    >
                      모임 저장 완료 (대시보드로 이동)
                    </Link>
                  );
                }
                return (
                  <>
                    <Link
                      href="/calendar/connect"
                      className="inline-flex h-12 items-center justify-center rounded-xl bg-brand-purple-light font-bold text-white"
                    >
                      캘린더 연동하기
                    </Link>
                    <Link
                      href="/schedule/create"
                      className="inline-flex h-12 items-center justify-center rounded-xl border border-brand-border-muted font-bold text-brand-purple"
                    >
                      모임 만들기
                    </Link>
                  </>
                );
              })()}
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              <SocialButton type="kakao" label="카카오로 시작하기" />
              <SocialButton type="google" label="구글로 시작하기" />
              <SocialButton type="naver" label="네이버로 시작하기" />
              <SocialButton type="apple" label="iCloud로 시작하기" dark />
            </div>

            <div className="my-8 h-px bg-brand-border-gray" />

            <form onSubmit={(e) => e.preventDefault()} className="grid gap-4">
              <TextField
                id="email"
                label="이메일"
                value={form.email}
                onChange={(value) => updateField("email", value)}
                onBlur={() => handleBlur("email")}
                error={touched.email && errors.email ? errors.email : ""}
                type="email"
                autoComplete="email"
              />
              <TextField
                id="phoneNumber"
                label="전화번호"
                value={form.phoneNumber}
                onChange={(value) => updateField("phoneNumber", value)}
                onBlur={() => handleBlur("phoneNumber")}
                error={
                  touched.phoneNumber && errors.phoneNumber
                    ? errors.phoneNumber
                    : ""
                }
                autoComplete="tel"
              />
              <TextField
                id="nickname"
                label="닉네임"
                value={form.nickname}
                onChange={(value) => updateField("nickname", value)}
                onBlur={() => handleBlur("nickname")}
                error={
                  touched.nickname && errors.nickname ? errors.nickname : ""
                }
                autoComplete="nickname"
              />
              <PasswordField
                id="password"
                label="비밀번호"
                value={form.password}
                onChange={(value) => updateField("password", value)}
                onBlur={() => handleBlur("password")}
                showPassword={showPassword}
                onToggleShow={() => setShowPassword(!showPassword)}
                error={
                  touched.password && errors.password ? errors.password : ""
                }
              />
              <PasswordField
                id="passwordConfirm"
                label="비밀번호 확인"
                value={form.passwordConfirm}
                onChange={(value) => updateField("passwordConfirm", value)}
                onBlur={() => handleBlur("passwordConfirm")}
                showPassword={showPasswordConfirm}
                onToggleShow={() =>
                  setShowPasswordConfirm(!showPasswordConfirm)
                }
                error={
                  touched.passwordConfirm && errors.passwordConfirm
                    ? errors.passwordConfirm
                    : ""
                }
              />

              <fieldset className="rounded-lg border border-brand-border-gray p-5">
                <legend className="px-1 text-lg font-bold">약관 동의</legend>
                <div className="grid gap-4">
                  {[
                    ["isAgeOver14", "만 14세 이상입니다", "필수"],
                    ["termsAgreed", "이용약관", "필수"],
                    ["privacyAgreed", "개인정보수집 및 이용동의", "필수"],
                    ["marketingAgreed", "개인정보 마케팅 활용 동의", "선택"],
                    ["eventSmsAgreed", "이벤트, 쿠폰 및 SMS 등 수신", "선택"],
                  ].map(([name, label, required]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between gap-3 text-base font-semibold text-brand-text-secondary"
                    >
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(form[name as keyof typeof form])}
                          onChange={(event) =>
                            updateField(
                              name as keyof typeof form,
                              event.target.checked,
                            )
                          }
                          required={
                            name === "isAgeOver14" ||
                            name === "termsAgreed" ||
                            name === "privacyAgreed"
                          }
                          className="h-5 w-5 rounded border-brand-border-gray"
                        />
                        {label}
                        <span className="text-brand-purple-light">
                          ({required})
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setActiveTermsKey(name as TermsKey)}
                        className="rounded p-1 hover:bg-brand-bg-light text-brand-text-light hover:text-brand-purple-light focus:outline-none"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </fieldset>

              {message ? (
                <p role="alert" className="text-sm text-destructive">
                  {message}
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => handleSubmit()}
                className={`inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand-purple-light px-7 text-base font-semibold text-white shadow-[0_10px_18px_rgba(98,82,172,0.22)] hover:bg-brand-purple ${
                  isSubmitting ? "cursor-not-allowed opacity-70" : ""
                }`}
              >
                {isSubmitting ? "가입 중" : "회원가입"}
              </button>
            </form>
            <p className="mt-6 text-center text-lg font-semibold text-brand-text-secondary">
              계정이 있으신가요?{" "}
              <Link href="/login" className="text-brand-purple">
                로그인
              </Link>
            </p>
          </>
        )}
      </section>

      {activeTermsKey && (
        <TermsModal
          termsKey={activeTermsKey}
          onClose={() => setActiveTermsKey(null)}
        />
      )}
    </main>
  );
}

function SocialButton({
  type,
  label,
  dark = false,
}: {
  type: "kakao" | "google" | "naver" | "apple";
  label: string;
  dark?: boolean;
}) {
  const handleOAuthLogin = async (provider: "google" | "kakao" | "apple") => {
    const supabase = createClient();
    let next = "/schedule/create";
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const nextParam = params.get("redirect") ?? params.get("next");
      if (
        nextParam &&
        (nextParam.startsWith("/") || !nextParam.includes("://"))
      ) {
        next = nextParam;
      }
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error(`${provider} 로그인 에러:`, err);
    }
  };

  const className = dark
    ? "bg-[#171717] text-white"
    : type === "kakao"
      ? "bg-[#fee500] text-[#191919]"
      : type === "naver"
        ? "bg-[#03c75a] text-white"
        : "border border-brand-border-gray bg-white text-brand-text-primary";
  const content = (
    <>
      <AuthProviderGlyph type={type} />
      {label}
    </>
  );
  if (type === "naver") {
    return (
      <a
        href="/api/auth/naver/login"
        className={`inline-flex h-14 items-center justify-center gap-3 rounded-lg text-lg font-bold ${className}`}
      >
        {content}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={() => handleOAuthLogin(type)}
      className={`inline-flex h-14 items-center justify-center gap-3 rounded-lg text-lg font-bold ${className}`}
    >
      {content}
    </button>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  onBlur,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  onBlur?: () => void;
  error?: string;
}) {
  return (
    <label htmlFor={id} className="grid gap-1.5 text-base font-bold">
      {label}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className={cn(
          "moim-input",
          error &&
            "border-destructive focus:border-destructive focus:ring-red-100",
        )}
        autoComplete={autoComplete}
        required
      />
      {error && (
        <span className="text-sm font-semibold text-destructive">{error}</span>
      )}
    </label>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  showPassword,
  onToggleShow,
  onBlur,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  showPassword?: boolean;
  onToggleShow?: () => void;
  onBlur?: () => void;
  error?: string;
}) {
  return (
    <label htmlFor={id} className="grid gap-1.5 text-base font-bold">
      {label}
      <span className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className={cn(
            "moim-input pr-12",
            error &&
              "border-destructive focus:border-destructive focus:ring-red-100",
          )}
          autoComplete="new-password"
          required
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-text-light hover:text-brand-purple-accent focus:outline-none"
        >
          {showPassword ? (
            <Eye className="h-5 w-5" />
          ) : (
            <EyeOff className="h-5 w-5" />
          )}
        </button>
      </span>
      {error && (
        <span className="text-sm font-semibold text-destructive">{error}</span>
      )}
    </label>
  );
}
