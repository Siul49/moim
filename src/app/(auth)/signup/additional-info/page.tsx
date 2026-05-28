"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function AdditionalInfoPage() {
  const [form, setForm] = useState({
    phoneNumber: "",
    isAgeOver14: false,
    termsAgreed: false,
    privacyAgreed: false,
    marketingAgreed: false,
    eventSmsAgreed: false,
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(name: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message ?? "추가 정보 저장에 실패했습니다.");
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

  return (
    <main className="min-h-screen bg-white px-6 py-14 text-[#222026]">
      <section className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-[420px] flex-col justify-center">
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="text-6xl font-extrabold tracking-normal text-[#6252ac]"
          >
            MOIM
          </Link>
          <p className="mt-4 text-lg font-semibold text-[#6f6a73]">
            마지막 정보만 확인하면 바로 모임을 만들 수 있어요
          </p>
        </div>

        <div className="mb-8 flex items-center gap-3 rounded-lg border border-[#eee8f4] bg-[#fbf7ff] p-4">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-[#6252ac]" />
          <p className="text-base font-semibold text-[#5f5865]">
            소셜 계정 연결이 완료되었습니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6">
          <label className="grid gap-2 text-lg font-bold">
            전화번호
            <input
              value={form.phoneNumber}
              onChange={(event) =>
                updateField("phoneNumber", event.target.value)
              }
              placeholder="010-0000-0000"
              className="h-14 rounded-lg border border-[#dedbe3] px-4 text-lg font-normal outline-none focus:border-[#8f7bd6] focus:ring-2 focus:ring-[#ece7fb]"
              autoComplete="tel"
              required
            />
          </label>

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
                <label
                  key={name}
                  className="flex items-center justify-between gap-3 text-base font-semibold text-[#504b55]"
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={Boolean(form[name as keyof typeof form])}
                      onChange={(event) =>
                        updateField(
                          name as keyof typeof form,
                          event.target.checked,
                        )
                      }
                      className="h-5 w-5 rounded border-[#dedbe3]"
                    />
                    {label}
                    <span className="text-[#8f7bd6]">({required})</span>
                  </span>
                </label>
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
            {isSubmitting ? "저장 중" : "모임 만들러 가기"}
          </button>
        </form>
      </section>
    </main>
  );
}
