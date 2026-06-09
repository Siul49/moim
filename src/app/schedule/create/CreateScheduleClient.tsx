"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCircle2,
  Copy,
  Link2,
} from "lucide-react";
import {
  MoimShell,
  MoimTopBar,
  ProgressHeader,
  PurpleButton,
} from "@/components/moim/reference-ui";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DayCode } from "@/types/schedule";

const DAY_OPTIONS: { value: DayCode; label: string }[] = [
  { value: "MON", label: "월요일" },
  { value: "TUE", label: "화요일" },
  { value: "WED", label: "수요일" },
  { value: "THU", label: "목요일" },
  { value: "FRI", label: "금요일" },
  { value: "SAT", label: "토요일" },
  { value: "SUN", label: "일요일" },
];

const HOURS = Array.from({ length: 15 }, (_, index) => index + 7);

export function CreateScheduleClient() {
  const [title, setTitle] = useState("제품 인터뷰");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [candidateDays, setCandidateDays] = useState<DayCode[]>(["MON"]);
  const [candidateStartHour, setCandidateStartHour] = useState("10");
  const [candidateEndHour, setCandidateEndHour] = useState("18");
  const [links, setLinks] = useState<{
    participant: string;
    host: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { copied: participantCopied, copy: copyParticipant } =
    useCopyFeedback();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLinks(null);
    setIsSubmitting(true);

    try {
      validateScheduleForm({
        candidateDays,
        candidateStartHour,
        candidateEndHour,
        durationMinutes,
      });

      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          durationMinutes: Number(durationMinutes),
          candidateDays,
          candidateStartHour: Number(candidateStartHour),
          candidateEndHour: Number(candidateEndHour),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "모임을 만들 수 없습니다.");
      }

      setLinks({
        participant: `${window.location.origin}${result.participantPath}`,
        host: `${window.location.origin}${result.hostPath}`,
      });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "요청에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleDay(day: DayCode, checked: boolean) {
    setCandidateDays((current) => {
      if (checked) return current.includes(day) ? current : [...current, day];
      return current.filter((value) => value !== day);
    });
  }

  return (
    <MoimShell className="bg-[#fcfaff]">
      <MoimTopBar closeHref="/" activeHref="/schedule/create" />
      <ProgressHeader label="1단계: 기본 정보" progress="25%" />

      <section className="mx-auto grid max-w-3xl gap-8 px-6 pb-24 pt-4">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-normal text-[#222026] sm:text-5xl bg-clip-text text-transparent bg-gradient-to-br from-[#222026] to-[#5f5865]">
            어떤 모임을 만드시나요?
          </h1>
          <p className="mt-4 text-lg font-medium leading-8 text-[#6f6a73]">
            모임 정보와 후보 시간을 정하면 초대 링크가 바로 만들어집니다.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 rounded-[2rem] border border-[#eee8f4] bg-white p-6 shadow-premium-lg sm:p-8 transition-all hover:shadow-[0_30px_80px_rgba(95,82,130,0.14)]"
        >
          <label className="grid gap-3 text-lg font-extrabold text-[#222026]">
            모임 제목
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-12 rounded-xl border border-[#dedbe3] px-4 text-base font-normal outline-none focus:border-[#8f7bd6] focus:ring-2 focus:ring-[#ece7fb] transition-all"
              maxLength={80}
              placeholder="예: 제품 인터뷰"
              required
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-3 text-lg font-extrabold text-[#222026]">
              소요 시간
              <select
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                className="h-12 rounded-xl border border-[#dedbe3] bg-white px-4 text-base font-normal outline-none focus:border-[#8f7bd6] focus:ring-2 focus:ring-[#ece7fb] transition-all"
              >
                <option value="30">30분</option>
                <option value="60">60분</option>
                <option value="90">90분</option>
                <option value="120">120분</option>
              </select>
            </label>

            <label className="grid gap-3 text-lg font-extrabold text-[#222026]">
              시작 시간
              <select
                value={candidateStartHour}
                onChange={(event) => setCandidateStartHour(event.target.value)}
                className="h-12 rounded-xl border border-[#dedbe3] bg-white px-4 text-base font-normal outline-none focus:border-[#8f7bd6] focus:ring-2 focus:ring-[#ece7fb] transition-all"
              >
                {HOURS.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}:00
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-3 text-lg font-extrabold text-[#222026]">
              종료 시간
              <select
                value={candidateEndHour}
                onChange={(event) => setCandidateEndHour(event.target.value)}
                className="h-12 rounded-xl border border-[#dedbe3] bg-white px-4 text-base font-normal outline-none focus:border-[#8f7bd6] focus:ring-2 focus:ring-[#ece7fb] transition-all"
              >
                {HOURS.concat(22).map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}:00
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className="grid gap-3">
            <legend className="text-lg font-extrabold text-[#222026]">
              후보 요일
            </legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {DAY_OPTIONS.map((day) => {
                const isChecked = candidateDays.includes(day.value);
                return (
                  <label
                    key={day.value}
                    className={cn(
                      "flex h-12 items-center gap-3 rounded-xl border px-4 text-base font-bold text-[#4f4a55] transition-all duration-150 cursor-pointer shadow-sm",
                      isChecked
                        ? "border-[#8f7bd6] bg-gradient-to-r from-[#f5efff] to-[#fcfaff] text-[#6252ac] ring-1 ring-[#8f7bd6]/30"
                        : "border-[#dedbe3] bg-white hover:bg-[#fbf9ff]",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(event) =>
                        toggleDay(day.value, event.target.checked)
                      }
                      className="h-5 w-5 rounded border-[#cfc8d9] accent-[#8f7bd6] cursor-pointer"
                    />
                    {day.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-4 rounded-[1.5rem] bg-[#fbf9ff] p-5 sm:grid-cols-2 border border-[#eee8f4]">
            <MiniInfo
              icon={<CalendarDays className="h-5 w-5 text-[#6252ac]" />}
              label="후보 기간"
              value={`${candidateDays.length}개 요일 · ${candidateStartHour}:00-${candidateEndHour}:00`}
            />
            <MiniInfo
              icon={<CalendarPlus className="h-5 w-5 text-[#6252ac]" />}
              label="진행 방식"
              value="링크 공유 후 참여자 입력"
            />
          </div>

          {error ? (
            <p role="alert" className="text-sm text-destructive font-semibold">
              {error}
            </p>
          ) : null}

          <PurpleButton
            type="submit"
            className="w-full text-base font-bold tracking-wide transition-all active:scale-[0.98]"
            disabled={isSubmitting}
          >
            {isSubmitting ? "생성 중" : "초대 링크 만들기"}
          </PurpleButton>
        </form>

        {links ? (
          <section className="rounded-[2rem] border border-[#eee8f4] bg-white p-5 sm:p-8 text-center shadow-premium-lg transition-all animate-bounceOnce">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f2eefd] text-[#6252ac] shadow-inner">
              <CheckCircle2 className="h-10 w-10" />
            </span>
            <h2 className="mt-5 text-3xl font-extrabold text-[#222026]">
              초대 링크가 준비됐습니다
            </h2>
            <p className="mt-3 text-base font-medium leading-7 text-[#77727c]">
              참여자는 가능한 시간을 제출하고, 호스트는 결과 화면에서 최종
              시간을 확정합니다.
            </p>

            <div className="mt-8 grid gap-4 text-left">
              <LinkField
                label="참여자 링크"
                testId="participant-link"
                value={links.participant}
              />
              <LinkField
                label="호스트 결과 링크"
                testId="host-link"
                value={links.host}
              />
            </div>

            {/* BM Nudge 1: 호스트 회원가입 유도 & 모임 저장 제안 */}
            <div className="mt-8 rounded-2xl border border-[#ece7fb] bg-gradient-to-br from-[#fcfaff] via-[#f7f3ff] to-white p-5 text-left shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-xl">💡</span>
                <div className="flex-1">
                  <p className="font-extrabold text-[#6252ac] text-sm sm:text-base">
                    이 모임을 대시보드에 저장할까요?
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-[#77727c]">
                    모임을 회원 대시보드에 저장해 두면 미응답 멤버 카톡 재촉 및
                    실시간 참여 메일 알림을 즉시 받아보실 수 있습니다.
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/signup?redirect=/workspace"
                      className="inline-flex h-9 items-center justify-center rounded-xl bg-[#8f7bd6] px-4.5 text-xs font-bold text-white hover:bg-[#7d68c9] transition-all hover:scale-[1.02] shadow-sm"
                    >
                      3초 만에 모임 저장하고 시작하기
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => copyParticipant(links.participant)}
                aria-live="polite"
                className={cn(
                  "inline-flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors shadow-sm",
                  participantCopied
                    ? "bg-[#e7f8ee] text-[#1f9254]"
                    : "bg-[#fee500] text-[#191919] hover:bg-[#ebd200]",
                )}
              >
                {participantCopied ? (
                  <>
                    <Check className="h-4 w-4" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    참여자 링크 복사
                  </>
                )}
              </button>
              <Link
                href={links.participant}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-12 w-full rounded-xl border-[#eee8f4] text-[#6252ac] font-bold shadow-sm hover:bg-[#fbf9ff]",
                )}
              >
                참여 화면 열기
              </Link>
              <Link
                href={links.host}
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "h-12 w-full rounded-xl bg-[#8f7bd6] text-white hover:bg-[#7d68c9] font-bold shadow-sm",
                )}
              >
                결과 화면 열기
              </Link>
            </div>
          </section>
        ) : null}
      </section>
    </MoimShell>
  );
}

function validateScheduleForm({
  candidateDays,
  candidateStartHour,
  candidateEndHour,
  durationMinutes,
}: {
  candidateDays: DayCode[];
  candidateStartHour: string;
  candidateEndHour: string;
  durationMinutes: string;
}) {
  if (candidateDays.length === 0) {
    throw new Error("후보 요일을 하나 이상 선택해 주세요.");
  }
  if (Number(candidateEndHour) <= Number(candidateStartHour)) {
    throw new Error("종료 시간은 시작 시간보다 늦어야 합니다.");
  }
  if (Number(durationMinutes) <= 0) {
    throw new Error("소요 시간은 0보다 커야 합니다.");
  }
}

function useCopyFeedback(resetMs = 1800) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    async (value: string) => {
      const ok = await copyText(value);
      if (ok) {
        setCopied(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopied(false), resetMs);
      }
      return ok;
    },
    [resetMs],
  );

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  return { copied, copy };
}

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // 보안 컨텍스트가 아니거나 권한이 없으면 아래 레거시 방식으로 폴백
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

function MiniInfo({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4">
      {icon}
      <div>
        <p className="text-sm font-bold text-[#77727c]">{label}</p>
        <p className="mt-1 font-extrabold text-[#222026]">{value}</p>
      </div>
    </div>
  );
}

function LinkField({
  label,
  testId,
  value,
}: {
  label: string;
  testId: string;
  value: string;
}) {
  const { copied, copy } = useCopyFeedback();

  return (
    <label className="grid gap-2 text-sm font-bold text-[#4f4a55]">
      <span className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-[#6252ac]" />
        {label}
        {copied ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1f9254]">
            <Check className="h-3.5 w-3.5" />
            복사됨
          </span>
        ) : null}
      </span>
      <span className="relative">
        <input
          data-testid={testId}
          value={value}
          readOnly
          className="h-12 w-full rounded-xl border border-[#dedbe3] bg-[#fbf7ff] px-4 pr-12 text-sm outline-none"
        />
        <button
          type="button"
          aria-label={copied ? `${label} 복사됨` : `${label} 복사`}
          onClick={() => copy(value)}
          className={cn(
            "absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg transition-colors",
            copied ? "text-[#1f9254]" : "text-[#6252ac] hover:bg-white",
          )}
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </span>
    </label>
  );
}
