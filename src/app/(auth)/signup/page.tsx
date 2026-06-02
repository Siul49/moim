"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Eye, EyeOff } from "lucide-react";
import { AuthProviderGlyph } from "@/components/moim/auth-social";
import { TermsModal, TermsKey } from "@/components/moim/TermsModal";

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    <main className="min-h-screen bg-white px-6 py-14 text-[#222026]">
      <section className="mx-auto w-full max-w-[420px]">
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="text-6xl font-extrabold tracking-normal text-[#6252ac]"
          >
            MOIM
          </Link>
          <p className="mt-4 text-lg font-semibold text-[#6f6a73]">
            모임을 더 가깝게, 일상을 더 특별하게
          </p>
        </div>

        {isComplete ? (
          <div className="rounded-[2rem] border border-[#eee8f4] bg-white p-10 text-center shadow-[0_20px_60px_rgba(95,82,130,0.12)]">
            <CheckCircle2 className="mx-auto h-14 w-14 text-[#6252ac]" />
            <h1 className="mt-5 text-3xl font-extrabold">회원가입 완료</h1>
            <p className="mt-3 text-[#77727c]">
              이제 캘린더를 연동하거나 바로 모임을 만들 수 있습니다.
            </p>
            <div className="mt-8 grid gap-3">
              <Link
                href="/calendar/connect"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-[#8f7bd6] font-bold text-white"
              >
                캘린더 연동하기
              </Link>
              <Link
                href="/schedule/create"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[#eee8f4] font-bold text-[#6252ac]"
              >
                모임 만들기
              </Link>
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

            <div className="my-8 h-px bg-[#dedbe3]" />

            <form onSubmit={handleSubmit} className="grid gap-6">
              <TextField
                label="이메일"
                value={form.email}
                onChange={(value) => updateField("email", value)}
                onBlur={() => handleBlur("email")}
                error={touched.email && errors.email ? errors.email : ""}
                type="email"
                autoComplete="email"
              />
              <TextField
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

              <fieldset className="rounded-lg border border-[#dedbe3] p-5">
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
                      className="flex items-center justify-between gap-3 text-base font-semibold text-[#504b55]"
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
                          className="h-5 w-5 rounded border-[#dedbe3]"
                        />
                        {label}
                        <span className="text-[#8f7bd6]">({required})</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setActiveTermsKey(name as TermsKey)}
                        className="rounded p-1 hover:bg-[#fbf7ff] text-[#aaa5ad] hover:text-[#8f7bd6] focus:outline-none"
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
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#8f7bd6] px-7 text-base font-semibold text-white shadow-[0_10px_18px_rgba(98,82,172,0.22)] hover:bg-[#7d68c9] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isSubmitting}
              >
                {isSubmitting ? "가입 중" : "회원가입"}
              </button>
            </form>
            <p className="mt-6 text-center text-lg font-semibold text-[#6f6a73]">
              계정이 있으신가요?{" "}
              <Link href="/login" className="text-[#6252ac]">
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
  const href =
    type === "kakao"
      ? "/api/auth/kakao/login"
      : type === "apple"
        ? "/api/auth/apple/login"
        : type === "google"
          ? "/api/auth/google/login"
          : type === "naver"
            ? "/api/auth/naver/login"
            : undefined;
  const className = dark
    ? "bg-[#171717] text-white"
    : type === "kakao"
      ? "bg-[#fee500] text-[#191919]"
      : type === "naver"
        ? "bg-[#03c75a] text-white"
        : "border border-[#dedbe3] bg-white text-[#222026]";
  const content = (
    <>
      <AuthProviderGlyph type={type} />
      {label}
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        className={`inline-flex h-14 items-center justify-center gap-3 rounded-lg text-lg font-bold ${className}`}
      >
        {content}
      </a>
    );
  }
  return (
    <button
      type="button"
      className={`inline-flex h-14 items-center justify-center gap-3 rounded-lg text-lg font-bold ${className}`}
    >
      {content}
    </button>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  onBlur,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  onBlur?: () => void;
  error?: string;
}) {
  return (
    <label className="grid gap-2 text-lg font-bold">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className={`h-14 rounded-lg border px-4 text-lg font-normal outline-none focus:ring-2 ${
          error
            ? "border-destructive focus:border-destructive focus:ring-red-100"
            : "border-[#dedbe3] focus:border-[#8f7bd6] focus:ring-[#ece7fb]"
        }`}
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
  label,
  value,
  onChange,
  showPassword,
  onToggleShow,
  onBlur,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  showPassword?: boolean;
  onToggleShow?: () => void;
  onBlur?: () => void;
  error?: string;
}) {
  return (
    <label className="grid gap-2 text-lg font-bold">
      {label}
      <span className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className={`h-14 w-full rounded-lg border px-4 pr-12 text-lg font-normal outline-none focus:ring-2 ${
            error
              ? "border-destructive focus:border-destructive focus:ring-red-100"
              : "border-[#dedbe3] focus:border-[#8f7bd6] focus:ring-[#ece7fb]"
          }`}
          autoComplete="new-password"
          required
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#aaa5ad] hover:text-[#8f7bd6] focus:outline-none"
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
