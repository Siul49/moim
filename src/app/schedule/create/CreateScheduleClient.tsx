"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
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
    <main className="min-h-screen bg-background px-5 py-8 sm:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            MOIM
          </Link>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-normal">
              새 모임 만들기
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              외부 캘린더 연결 없이도 초대 링크를 만들고 참여자 가능 시간을 모을
              수 있습니다.
            </p>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="grid gap-5 rounded-lg border border-border bg-card p-5"
        >
          <label className="grid gap-2 text-sm font-medium">
            모임 제목
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-11 rounded-md border border-input bg-background px-3 text-base outline-none focus:ring-2 focus:ring-ring"
              maxLength={80}
              required
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium">
              소요 시간
              <select
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                className="h-11 rounded-md border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="30">30분</option>
                <option value="60">60분</option>
                <option value="90">90분</option>
                <option value="120">120분</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              시작 시간
              <select
                value={candidateStartHour}
                onChange={(event) => setCandidateStartHour(event.target.value)}
                className="h-11 rounded-md border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-ring"
              >
                {HOURS.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}:00
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              종료 시간
              <select
                value={candidateEndHour}
                onChange={(event) => setCandidateEndHour(event.target.value)}
                className="h-11 rounded-md border border-input bg-background px-3 outline-none focus:ring-2 focus:ring-ring"
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
            <legend className="text-sm font-medium">후보 요일</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DAY_OPTIONS.map((day) => (
                <label
                  key={day.value}
                  className="flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={candidateDays.includes(day.value)}
                    onChange={(event) =>
                      toggleDay(day.value, event.target.checked)
                    }
                    className="h-4 w-4"
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </fieldset>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "생성 중" : "초대 링크 만들기"}
          </Button>
        </form>

        {links ? (
          <section className="grid gap-4 rounded-lg border border-border bg-card p-5">
            <div>
              <h2 className="text-xl font-semibold">
                초대 링크가 준비됐습니다
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                참여자 링크는 공유해도 되고, 호스트 링크는 결과 확인용으로만
                보관하세요.
              </p>
            </div>

            <label className="grid gap-2 text-sm font-medium">
              참여자 링크
              <input
                data-testid="participant-link"
                value={links.participant}
                readOnly
                className="h-11 rounded-md border border-input bg-muted px-3 text-sm outline-none"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              호스트 결과 링크
              <input
                data-testid="host-link"
                value={links.host}
                readOnly
                className="h-11 rounded-md border border-input bg-muted px-3 text-sm outline-none"
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={links.participant} className="w-full sm:w-auto">
                <Button variant="outline" className="w-full">
                  참여 화면 열기
                </Button>
              </Link>
              <Link href={links.host} className="w-full sm:w-auto">
                <Button className="w-full">결과 화면 열기</Button>
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
