"use client";

import { FormEvent, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Copy,
  Link2,
  MessageCircle,
} from "lucide-react";
import {
  MoimShell,
  MoimTopBar,
  ProgressHeader,
  PurpleButton,
} from "@/components/moim/reference-ui";
import { Button } from "@/components/ui/button";
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
    <MoimShell className="bg-white">
      <MoimTopBar closeHref="/" activeHref="/schedule/create" />
      <ProgressHeader label="1단계: 기본 정보" progress="25%" />

      <section className="mx-auto grid max-w-3xl gap-8 px-6 pb-24 pt-10">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-normal text-[#222026] sm:text-5xl">
            어떤 모임을 만드시나요?
          </h1>
          <p className="mt-4 text-lg font-medium leading-8 text-[#6f6a73]">
            모임 정보와 후보 시간을 정하면 초대 링크가 바로 만들어집니다.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 rounded-[2rem] border border-[#eee8f4] bg-white p-6 shadow-[0_24px_70px_rgba(95,82,130,0.12)] sm:p-8"
        >
          <label className="grid gap-3 text-lg font-extrabold">
            모임 제목
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-14 rounded-xl border border-[#dedbe3] px-4 text-lg font-normal outline-none focus:border-[#8f7bd6] focus:ring-2 focus:ring-[#ece7fb]"
              maxLength={80}
              placeholder="예: 제품 인터뷰"
              required
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-3 text-lg font-extrabold">
              소요 시간
              <select
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                className="h-14 rounded-xl border border-[#dedbe3] px-4 text-base font-normal outline-none focus:border-[#8f7bd6] focus:ring-2 focus:ring-[#ece7fb]"
              >
                <option value="30">30분</option>
                <option value="60">60분</option>
                <option value="90">90분</option>
                <option value="120">120분</option>
              </select>
            </label>

            <label className="grid gap-3 text-lg font-extrabold">
              시작 시간
              <select
                value={candidateStartHour}
                onChange={(event) => setCandidateStartHour(event.target.value)}
                className="h-14 rounded-xl border border-[#dedbe3] px-4 text-base font-normal outline-none focus:border-[#8f7bd6] focus:ring-2 focus:ring-[#ece7fb]"
              >
                {HOURS.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}:00
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-3 text-lg font-extrabold">
              종료 시간
              <select
                value={candidateEndHour}
                onChange={(event) => setCandidateEndHour(event.target.value)}
                className="h-14 rounded-xl border border-[#dedbe3] px-4 text-base font-normal outline-none focus:border-[#8f7bd6] focus:ring-2 focus:ring-[#ece7fb]"
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
            <legend className="text-lg font-extrabold">후보 요일</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {DAY_OPTIONS.map((day) => (
                <label
                  key={day.value}
                  className="flex h-12 items-center gap-3 rounded-xl border border-[#dedbe3] bg-[#fbf7ff] px-4 text-base font-bold text-[#4f4a55]"
                >
                  <input
                    type="checkbox"
                    checked={candidateDays.includes(day.value)}
                    onChange={(event) =>
                      toggleDay(day.value, event.target.checked)
                    }
                    className="h-5 w-5 rounded border-[#cfc8d9]"
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 rounded-[1.5rem] bg-[#fbf7ff] p-5 sm:grid-cols-2">
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
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <PurpleButton
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "생성 중" : "초대 링크 만들기"}
          </PurpleButton>
        </form>

        {links ? (
          <section className="rounded-[2rem] border border-[#eee8f4] bg-white p-8 text-center shadow-[0_24px_70px_rgba(95,82,130,0.12)]">
            <CheckCircle2 className="mx-auto h-16 w-16 text-[#6252ac]" />
            <h2 className="mt-5 text-3xl font-extrabold">
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

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => copyText(links.participant)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#fee500] text-sm font-bold text-[#191919]"
              >
                <MessageCircle className="h-4 w-4" />
                카카오 공유
              </button>
              <Link href={links.participant}>
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-xl border-[#eee8f4] text-[#6252ac]"
                >
                  참여 화면 열기
                </Button>
              </Link>
              <Link href={links.host}>
                <Button className="h-12 w-full rounded-xl bg-[#8f7bd6] text-white hover:bg-[#7d68c9]">
                  결과 화면 열기
                </Button>
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

async function copyText(value: string) {
  await navigator.clipboard?.writeText(value);
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
  return (
    <label className="grid gap-2 text-sm font-bold text-[#4f4a55]">
      <span className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-[#6252ac]" />
        {label}
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
          aria-label={`${label} 복사`}
          onClick={() => copyText(value)}
          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#6252ac] hover:bg-white"
        >
          <Copy className="h-4 w-4" />
        </button>
      </span>
    </label>
  );
}
