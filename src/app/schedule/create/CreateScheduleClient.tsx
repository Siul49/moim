"use client";

import { FormEvent, useState, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus,
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

const DAY_SHORT_LABELS: Record<DayCode, string> = {
  MON: "월",
  TUE: "화",
  WED: "수",
  THU: "목",
  FRI: "금",
  SAT: "토",
  SUN: "일",
};

// 8:00 to 22:00 (14 hours range)
const HOURS = Array.from({ length: 14 }, (_, index) => index + 8);

export function CreateScheduleClient() {
  const [title, setTitle] = useState("제품 인터뷰");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [selectedSlots, setSelectedSlots] = useState<string[]>(() => {
    // Default to Mon-Fri 9:00 - 18:00
    const slots: string[] = [];
    for (const day of ["MON", "TUE", "WED", "THU", "FRI"] as DayCode[]) {
      for (let hour = 9; hour < 18; hour++) {
        slots.push(`${day}-${hour}`);
      }
    }
    return slots;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState<"select" | "deselect" | null>(
    null,
  );
  const [links, setLinks] = useState<{
    participant: string;
    host: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute bounding parameters from selectedSlots under-the-hood
  const candidateDays = useMemo(() => {
    const days = new Set<DayCode>();
    selectedSlots.forEach((slot) => {
      const [day] = slot.split("-");
      days.add(day as DayCode);
    });
    return DAY_OPTIONS.map((d) => d.value).filter((day) => days.has(day));
  }, [selectedSlots]);

  const { candidateStartHour, candidateEndHour } = useMemo(() => {
    if (selectedSlots.length === 0) {
      return { candidateStartHour: 9, candidateEndHour: 18 };
    }
    let minHour = 24;
    let maxHour = 0;
    selectedSlots.forEach((slot) => {
      const [, hourStr] = slot.split("-");
      const hour = Number(hourStr);
      if (hour < minHour) minHour = hour;
      if (hour > maxHour) maxHour = hour;
    });
    return {
      candidateStartHour: minHour,
      candidateEndHour: maxHour + 1,
    };
  }, [selectedSlots]);

  // Mouse drag handlers
  const handleMouseDown = (key: string) => {
    setIsDragging(true);
    const shouldSelect = !selectedSlots.includes(key);
    setDragAction(shouldSelect ? "select" : "deselect");
    setSelectedSlots((prev) =>
      shouldSelect ? [...prev, key] : prev.filter((k) => k !== key),
    );
  };

  const handleMouseEnter = (key: string) => {
    if (!isDragging || !dragAction) return;
    setSelectedSlots((prev) => {
      if (dragAction === "select") {
        return prev.includes(key) ? prev : [...prev, key];
      } else {
        return prev.filter((k) => k !== key);
      }
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragAction(null);
  };

  // Touch drag handlers for mobile
  const handleTouchStart = (e: React.TouchEvent, key: string) => {
    setIsDragging(true);
    const shouldSelect = !selectedSlots.includes(key);
    setDragAction(shouldSelect ? "select" : "deselect");
    setSelectedSlots((prev) =>
      shouldSelect ? [...prev, key] : prev.filter((k) => k !== key),
    );
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !dragAction) return;
    const touch = e.touches[0];
    if (!touch) return;
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element) {
      const key = element.getAttribute("data-slot-key");
      if (key) {
        setSelectedSlots((prev) => {
          if (dragAction === "select") {
            return prev.includes(key) ? prev : [...prev, key];
          } else {
            return prev.filter((k) => k !== key);
          }
        });
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setDragAction(null);
  };

  // Preset selectors
  const selectPreset = (preset: "weekday" | "weekend" | "all" | "clear") => {
    if (preset === "clear") {
      setSelectedSlots([]);
    } else if (preset === "all") {
      const slots: string[] = [];
      DAY_OPTIONS.forEach((day) => {
        for (let hour = 8; hour < 22; hour++) {
          slots.push(`${day.value}-${hour}`);
        }
      });
      setSelectedSlots(slots);
    } else if (preset === "weekday") {
      const slots: string[] = [];
      (["MON", "TUE", "WED", "THU", "FRI"] as DayCode[]).forEach((day) => {
        for (let hour = 9; hour < 18; hour++) {
          slots.push(`${day}-${hour}`);
        }
      });
      setSelectedSlots(slots);
    } else if (preset === "weekend") {
      const slots: string[] = [];
      (["SAT", "SUN"] as DayCode[]).forEach((day) => {
        for (let hour = 10; hour < 18; hour++) {
          slots.push(`${day}-${hour}`);
        }
      });
      setSelectedSlots(slots);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setDragAction(null);
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLinks(null);

    if (selectedSlots.length === 0) {
      setError("후보 시간대를 최소 하나 이상 선택해 주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      validateScheduleForm({
        candidateDays,
        candidateStartHour: String(candidateStartHour),
        candidateEndHour: String(candidateEndHour),
        durationMinutes,
      });

      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          durationMinutes: Number(durationMinutes),
          candidateDays,
          candidateStartHour,
          candidateEndHour,
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

  return (
    <MoimShell className="bg-brand-bg-light">
      <MoimTopBar closeHref="/" activeHref="/schedule/create" />
      <ProgressHeader label="1단계: 기본 정보" progress="25%" />

      <section className="mx-auto grid max-w-3xl gap-8 px-6 pb-24 pt-4">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-normal text-brand-text-primary sm:text-5xl bg-clip-text text-transparent bg-gradient-to-br from-brand-text-primary to-brand-text-secondary">
            어떤 모임을 만드시나요?
          </h1>
          <p className="mt-4 text-lg font-medium leading-8 text-brand-text-secondary">
            모임 정보와 후보 시간을 정하면 초대 링크가 바로 만들어집니다.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 rounded-[2rem] border border-brand-border-muted bg-white p-6 shadow-premium-lg sm:p-8 transition-all hover:shadow-[0_30px_80px_rgba(95,82,130,0.14)]"
        >
          <label className="grid gap-3 text-lg font-extrabold text-brand-text-primary">
            모임 제목
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-12 rounded-xl border border-brand-border-gray px-4 text-base font-normal outline-none focus:border-brand-purple-light focus:ring-2 focus:ring-brand-purple-ring transition-all"
              maxLength={80}
              placeholder="예: 제품 인터뷰"
              required
            />
          </label>

          <div className="grid gap-4">
            <label className="grid gap-3 text-lg font-extrabold text-brand-text-primary">
              소요 시간
              <select
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                className="h-12 w-full sm:w-1/3 rounded-xl border border-brand-border-gray bg-white px-4 text-base font-normal outline-none focus:border-brand-purple-light focus:ring-2 focus:ring-brand-purple-ring transition-all"
              >
                <option value="30">30분</option>
                <option value="60">60분</option>
                <option value="90">90분</option>
                <option value="120">120분</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3">
            <span className="text-lg font-extrabold text-brand-text-primary flex items-center gap-1.5">
              📅 후보 시간대 설정
            </span>
            <p className="text-xs text-brand-text-muted">
              조율 후보로 삼고 싶은 요일과 시간대를 드래그하거나 클릭하여
              칠해주세요. (시안 13)
            </p>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 my-2">
              <button
                type="button"
                onClick={() => selectPreset("weekday")}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-brand-border-muted bg-white text-brand-text-secondary hover:bg-brand-bg-light transition-all shadow-sm active:scale-95"
              >
                평일 9-18시
              </button>
              <button
                type="button"
                onClick={() => selectPreset("weekend")}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-brand-border-muted bg-white text-brand-text-secondary hover:bg-brand-bg-light transition-all shadow-sm active:scale-95"
              >
                주말 10-18시
              </button>
              <button
                type="button"
                onClick={() => selectPreset("all")}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-brand-border-muted bg-white text-brand-text-secondary hover:bg-brand-bg-light transition-all shadow-sm active:scale-95"
              >
                전체 선택
              </button>
              <button
                type="button"
                onClick={() => selectPreset("clear")}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-brand-border-muted bg-white text-brand-purple hover:bg-brand-bg-light transition-all shadow-sm active:scale-95"
              >
                전체 해제
              </button>
            </div>

            {/* Interactive Grid */}
            <div className="rounded-[1.5rem] border border-brand-border-muted p-5 bg-brand-bg-light/30">
              <div className="overflow-x-auto scroller-style">
                <div className="min-w-[320px] grid grid-cols-8 gap-1 text-[10px] font-bold text-center select-none">
                  {/* Header col */}
                  <div className="h-6 flex items-center justify-center text-brand-text-muted">
                    시간
                  </div>
                  {DAY_OPTIONS.map((day) => (
                    <div
                      key={day.value}
                      className="h-6 flex items-center justify-center text-brand-text-muted"
                    >
                      {DAY_SHORT_LABELS[day.value]}
                    </div>
                  ))}

                  {/* Time Rows */}
                  {HOURS.map((hour) => {
                    return (
                      <div key={hour} className="contents">
                        <div className="h-8 flex items-center justify-center text-[10px] text-brand-text-light font-medium border-t border-brand-border-muted/30">
                          {hour}:00
                        </div>
                        {DAY_OPTIONS.map((day) => {
                          const key = `${day.value}-${hour}`;
                          const isSelected = selectedSlots.includes(key);
                          return (
                            <div
                              key={day.value}
                              data-slot-key={key}
                              onMouseDown={() => handleMouseDown(key)}
                              onMouseEnter={() => handleMouseEnter(key)}
                              onMouseUp={handleMouseUp}
                              onTouchStart={(e) => handleTouchStart(e, key)}
                              onTouchMove={handleTouchMove}
                              onTouchEnd={handleTouchEnd}
                              className={cn(
                                "h-8 rounded transition-all border cursor-pointer touch-none select-none",
                                isSelected
                                  ? "bg-brand-purple text-white border-brand-purple shadow-sm hover:bg-brand-purple-hover"
                                  : "bg-white border-brand-border-gray hover:bg-brand-bg-light",
                              )}
                              title={`${day.label} ${hour}:00 - ${hour + 1}:00`}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 rounded-[1.5rem] bg-brand-bg-light p-5 sm:grid-cols-2 border border-brand-border-muted">
            <MiniInfo
              icon={<CalendarDays className="h-5 w-5 text-brand-purple" />}
              label="후보 기간"
              value={`${candidateDays.length}개 요일 · ${candidateStartHour}:00-${candidateEndHour}:00`}
            />
            <MiniInfo
              icon={<CalendarPlus className="h-5 w-5 text-brand-purple" />}
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
          <section className="rounded-[2rem] border border-brand-border-muted bg-white p-5 sm:p-8 text-center shadow-premium-lg transition-all animate-bounceOnce">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-bg-muted text-brand-purple shadow-inner">
              <CheckCircle2 className="h-10 w-10" />
            </span>
            <h2 className="mt-5 text-3xl font-extrabold text-brand-text-primary">
              초대 링크가 준비됐습니다
            </h2>
            <p className="mt-3 text-base font-medium leading-7 text-brand-text-muted">
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
            <div className="mt-8 rounded-2xl border border-brand-border-muted bg-gradient-to-br from-brand-bg-light via-brand-bg-muted to-white p-5 text-left shadow-sm">
              <div className="flex items-start gap-3">
                <span className="text-xl">💡</span>
                <div className="flex-1">
                  <p className="font-extrabold text-brand-purple text-sm sm:text-base">
                    이 모임을 대시보드에 저장할까요?
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-brand-text-muted">
                    모임을 회원 대시보드에 저장해 두면 미응답 멤버 카톡 재촉 및
                    실시간 참여 메일 알림을 즉시 받아보실 수 있습니다.
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/signup?redirect=/workspace"
                      className="inline-flex h-9 items-center justify-center rounded-xl bg-brand-purple-light px-4.5 text-xs font-bold text-white hover:bg-brand-purple transition-all hover:scale-[1.02] shadow-sm"
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
                onClick={() => copyText(links.participant)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#fee500] text-sm font-bold text-[#191919] hover:bg-[#ebd200] transition-colors shadow-sm"
              >
                <Copy className="h-4 w-4" />
                참여자 링크 복사
              </button>
              <Link
                href={links.participant}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-12 w-full rounded-xl border-brand-border-muted text-brand-purple font-bold shadow-sm hover:bg-brand-bg-light",
                )}
              >
                참여 화면 열기
              </Link>
              <Link
                href={links.host}
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "h-12 w-full rounded-xl bg-brand-purple-light text-white hover:bg-brand-purple font-bold shadow-sm",
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
        <p className="text-sm font-bold text-brand-text-muted">{label}</p>
        <p className="mt-1 font-extrabold text-brand-text-primary">{value}</p>
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
    <label className="grid gap-2 text-sm font-bold text-brand-text-secondary">
      <span className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-brand-purple" />
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
