"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCircle2,
  Copy,
  Link2,
  ArrowLeft,
  CheckCircle,
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
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [title, setTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [candidateStartDate, setCandidateStartDate] = useState("");
  const [candidateEndDate, setCandidateEndDate] = useState("");
  const [responseDeadline, setResponseDeadline] = useState("");

  // Calendar connection states
  const [hasGoogle, setHasGoogle] = useState(false);
  const [hasICloud, setHasICloud] = useState(false);
  const [blockBusyTimes, setBlockBusyTimes] = useState(true);
  const [busySlots, setBusySlots] = useState<string[]>([]);

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
  const [dragAction, setDragAction] = useState<"select" | "deselect" | null>(
    null,
  );
  const [links, setLinks] = useState<{
    participant: string;
    host: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { copied: participantCopied, copy: copyParticipant } =
    useCopyFeedback();

  const gridRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

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

  // Load calendar connections (구글/애플 모두 쿠키 기반이므로 status API로 판단)
  useEffect(() => {
    async function checkConnections() {
      try {
        const res = await fetch("/api/calendar/status", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const google = Boolean(data.googleConnected);
        const icloud = Boolean(data.icloudConnected);
        setHasGoogle(google);
        setHasICloud(icloud);

        // If calendar is connected, load some realistic mock busy slots
        if (google || icloud) {
          setBusySlots([
            "MON-10",
            "MON-11",
            "WED-14",
            "WED-15",
            "FRI-16",
            "FRI-17",
          ]);
        }
      } catch {
        // 상태 조회 실패 시 미연동 상태로 둔다
      }
    }
    checkConnections();
  }, []);

  // Filter out busy slots if user decides to block them
  useEffect(() => {
    if (blockBusyTimes && busySlots.length > 0) {
      setSelectedSlots((prev) =>
        prev.filter((slot) => !busySlots.includes(slot)),
      );
    }
  }, [blockBusyTimes, busySlots]);

  // Mouse drag handlers
  const handleMouseDown = (key: string) => {
    if (blockBusyTimes && busySlots.includes(key)) return;
    isDraggingRef.current = true;
    const shouldSelect = !selectedSlots.includes(key);
    setDragAction(shouldSelect ? "select" : "deselect");
    setSelectedSlots((prev) =>
      shouldSelect ? [...prev, key] : prev.filter((k) => k !== key),
    );
  };

  const handleMouseEnter = (key: string) => {
    if (blockBusyTimes && busySlots.includes(key)) return;
    if (!isDraggingRef.current || !dragAction) return;
    setSelectedSlots((prev) => {
      if (dragAction === "select") {
        return prev.includes(key) ? prev : [...prev, key];
      } else {
        return prev.filter((k) => k !== key);
      }
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setDragAction(null);
  };

  // Touch drag handlers for mobile
  const handleTouchStart = (e: React.TouchEvent, key: string) => {
    if (blockBusyTimes && busySlots.includes(key)) return;
    isDraggingRef.current = true;
    const shouldSelect = !selectedSlots.includes(key);
    setDragAction(shouldSelect ? "select" : "deselect");
    setSelectedSlots((prev) =>
      shouldSelect ? [...prev, key] : prev.filter((k) => k !== key),
    );
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !dragAction) return;
    const touch = e.touches[0];
    if (!touch) return;
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element) {
      const key = element.getAttribute("data-slot-key");
      if (key && !(blockBusyTimes && busySlots.includes(key))) {
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
    isDraggingRef.current = false;
    setDragAction(null);
  };

  // 터치 드래그 중 스크롤 방지용 native event listener 바인딩
  useEffect(() => {
    const gridEl = gridRef.current;
    if (!gridEl) return;

    const preventDefaultTouch = (e: TouchEvent) => {
      if (isDraggingRef.current) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    gridEl.addEventListener("touchmove", preventDefaultTouch, {
      passive: false,
    });
    return () => {
      gridEl.removeEventListener("touchmove", preventDefaultTouch);
    };
  }, []);

  useEffect(() => {
    const handleGlobalUp = () => {
      isDraggingRef.current = false;
      setDragAction(null);
    };
    window.addEventListener("mouseup", handleGlobalUp);
    window.addEventListener("touchend", handleGlobalUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalUp);
      window.removeEventListener("touchend", handleGlobalUp);
    };
  }, []);

  // Preset selectors
  const selectPreset = (preset: "weekday" | "weekend" | "all" | "clear") => {
    const isSlotBusy = (k: string) => blockBusyTimes && busySlots.includes(k);

    if (preset === "clear") {
      setSelectedSlots([]);
    } else if (preset === "all") {
      const slots: string[] = [];
      DAY_OPTIONS.forEach((day) => {
        for (let hour = 8; hour < 22; hour++) {
          const key = `${day.value}-${hour}`;
          if (!isSlotBusy(key)) slots.push(key);
        }
      });
      setSelectedSlots(slots);
    } else if (preset === "weekday") {
      const slots: string[] = [];
      (["MON", "TUE", "WED", "THU", "FRI"] as DayCode[]).forEach((day) => {
        for (let hour = 9; hour < 18; hour++) {
          const key = `${day}-${hour}`;
          if (!isSlotBusy(key)) slots.push(key);
        }
      });
      setSelectedSlots(slots);
    } else if (preset === "weekend") {
      const slots: string[] = [];
      (["SAT", "SUN"] as DayCode[]).forEach((day) => {
        for (let hour = 10; hour < 18; hour++) {
          const key = `${day}-${hour}`;
          if (!isSlotBusy(key)) slots.push(key);
        }
      });
      setSelectedSlots(slots);
    }
  };

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
      const parsedDuration = parseInt(durationMinutes.replace(/[^0-9]/g, ""));
      if (isNaN(parsedDuration)) {
        throw new Error("소요 시간은 숫자 형태로 입력해 주세요.");
      }

      validateScheduleForm({
        candidateDays,
        candidateStartHour: String(candidateStartHour),
        candidateEndHour: String(candidateEndHour),
        durationMinutes: String(parsedDuration),
        candidateStartDate,
        candidateEndDate,
        responseDeadline,
      });

      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          durationMinutes: parsedDuration,
          candidateDays,
          candidateStartHour,
          candidateEndHour,
          candidateStartDate,
          candidateEndDate,
          responseDeadline,
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
      setStep(4);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "요청에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Get Progress Percent and label
  const progressPercent = useMemo(() => {
    switch (step) {
      case 1:
        return "25%";
      case 2:
        return "50%";
      case 3:
        return "75%";
      case 4:
        return "100%";
    }
  }, [step]);

  const progressLabel = useMemo(() => {
    switch (step) {
      case 1:
        return "1단계: 기본 정보";
      case 2:
        return "2단계: 캘린더 연동";
      case 3:
        return "3단계: 후보 시간대";
      case 4:
        return "4단계: 초대장 완료";
    }
  }, [step]);

  return (
    <MoimShell className="bg-brand-bg-light">
      <MoimTopBar closeHref="/" activeHref="/schedule/create" />
      <ProgressHeader label={progressLabel} progress={progressPercent} />

      <section className="mx-auto grid max-w-3xl gap-8 px-6 pb-24 pt-4">
        {step < 4 && (
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-normal text-brand-text-primary sm:text-5xl bg-clip-text text-transparent bg-gradient-to-br from-brand-text-primary to-brand-text-secondary">
              {step === 1 && "어떤 모임을 만드시나요?"}
              {step === 2 && "내 일정을 연동해 볼까요?"}
              {step === 3 && "조율할 시간 범위를 정해주세요"}
            </h1>
            <p className="mt-4 text-lg font-medium leading-8 text-brand-text-secondary">
              {step === 1 &&
                "모임 정보와 후보 시간을 정하면 초대 링크가 바로 만들어집니다."}
              {step === 2 &&
                "캘린더를 연동하면 이미 바쁜 시간대를 자동으로 후보에서 필터링해 줍니다."}
              {step === 3 &&
                "시간표 드래그 및 Preset을 활용해 후보 시간 범위를 정해보세요."}
            </p>
          </div>
        )}

        <form
          onSubmit={(e) => e.preventDefault()}
          className={cn(
            "grid gap-6 rounded-[2rem] border border-brand-border-muted bg-white p-6 shadow-premium-lg sm:p-8 transition-all hover:shadow-[0_30px_80px_rgba(95,82,130,0.14)]",
            step === 4 && "hidden",
          )}
        >
          {/* Step 1: 기본 정보 입력 */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <label className="grid gap-3 text-sm font-bold text-brand-text-primary">
                모임 제목
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="h-12 rounded-xl border border-brand-border-gray px-4 text-base font-normal outline-none focus:border-brand-purple-light focus:ring-2 focus:ring-brand-purple-ring transition-all"
                  maxLength={80}
                  placeholder="예: 24학번 동기 모임 🍕"
                  required
                />
              </label>

              <label className="grid gap-3 text-sm font-bold text-brand-text-primary">
                예상 소요시간
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(event.target.value)}
                  className="h-12 w-full rounded-xl border border-brand-border-gray bg-white px-4 text-base font-normal outline-none focus:border-brand-purple-light focus:ring-2 focus:ring-brand-purple-ring transition-all"
                  placeholder="예: 120 (분 단위)"
                  required
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="grid gap-3 text-sm font-bold text-brand-text-primary">
                  후보 날짜 범위 (시작)
                  <input
                    type="date"
                    value={candidateStartDate}
                    onChange={(event) =>
                      setCandidateStartDate(event.target.value)
                    }
                    className="h-12 rounded-xl border border-brand-border-gray px-4 text-base font-normal outline-none focus:border-brand-purple-light focus:ring-2 focus:ring-brand-purple-ring transition-all text-brand-text-primary"
                    required
                  />
                </label>
                <label className="grid gap-3 text-sm font-bold text-brand-text-primary">
                  후보 날짜 범위 (종료)
                  <input
                    type="date"
                    value={candidateEndDate}
                    onChange={(event) =>
                      setCandidateEndDate(event.target.value)
                    }
                    className="h-12 rounded-xl border border-brand-border-gray px-4 text-base font-normal outline-none focus:border-brand-purple-light focus:ring-2 focus:ring-brand-purple-ring transition-all text-brand-text-primary"
                    required
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm font-bold text-brand-text-primary">
                응답 마감일
                <input
                  type="datetime-local"
                  value={responseDeadline}
                  onChange={(event) => setResponseDeadline(event.target.value)}
                  step={600}
                  className="h-12 rounded-xl border border-brand-border-gray px-4 text-base font-normal outline-none focus:border-brand-purple-light focus:ring-2 focus:ring-brand-purple-ring transition-all text-brand-text-primary"
                  required
                />
                <span className="text-sm font-normal text-brand-text-muted">
                  이 날짜 이후로는 응답을 받을 수 없습니다.
                </span>
              </label>

              <div className="pt-4 flex justify-end">
                <PurpleButton
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 text-sm font-bold tracking-wide active:scale-95"
                >
                  다음 단계로 →
                </PurpleButton>
              </div>
            </div>
          )}

          {/* Step 2: 캘린더 연동 설정 */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <span className="text-lg font-extrabold text-brand-text-primary flex items-center gap-1.5">
                📅 캘린더 연동 관리
              </span>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* Google Connection status */}
                <div className="rounded-xl border border-brand-border-muted p-4 bg-brand-bg-light/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-xs">
                      G
                    </span>
                    <div>
                      <p className="text-xs font-extrabold text-brand-text-primary">
                        Google Calendar
                      </p>
                      <p className="text-[10px] text-brand-text-muted">
                        {hasGoogle ? "연동 완료" : "연동 정보 없음"}
                      </p>
                    </div>
                  </div>
                  {hasGoogle ? (
                    <span className="text-[10px] font-bold text-brand-purple bg-brand-purple-ring px-2.5 py-1 rounded-full border border-brand-border-muted flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> 연동됨
                    </span>
                  ) : (
                    <Link
                      href="/dashboard/settings"
                      target="_blank"
                      className="text-[10px] font-bold text-brand-text-secondary hover:text-brand-purple"
                    >
                      연동하기 →
                    </Link>
                  )}
                </div>

                {/* iCloud Connection status */}
                <div className="rounded-xl border border-brand-border-muted p-4 bg-brand-bg-light/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-800 font-bold text-xs">
                      A
                    </span>
                    <div>
                      <p className="text-xs font-extrabold text-brand-text-primary">
                        Apple iCloud
                      </p>
                      <p className="text-[10px] text-brand-text-muted">
                        {hasICloud ? "연동 완료" : "연동 정보 없음"}
                      </p>
                    </div>
                  </div>
                  {hasICloud ? (
                    <span className="text-[10px] font-bold text-brand-purple bg-brand-purple-ring px-2.5 py-1 rounded-full border border-brand-border-muted flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> 연동됨
                    </span>
                  ) : (
                    <Link
                      href="/dashboard/settings"
                      target="_blank"
                      className="text-[10px] font-bold text-brand-text-secondary hover:text-brand-purple"
                    >
                      연동하기 →
                    </Link>
                  )}
                </div>
              </div>

              {hasGoogle || hasICloud ? (
                <label className="flex items-center gap-3 rounded-xl border border-brand-border-muted bg-brand-bg-light/30 p-4 text-xs font-bold text-brand-text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={blockBusyTimes}
                    onChange={(e) => setBlockBusyTimes(e.target.checked)}
                    className="h-5 w-5 rounded border-brand-border-gray accent-brand-purple-light cursor-pointer"
                  />
                  연동 캘린더에서 내 바쁜 시간 후보지에서 자동 제외 (추천)
                </label>
              ) : (
                <div className="rounded-xl border border-dashed border-brand-border-muted p-4 bg-brand-bg-light/10 text-center">
                  <p className="text-xs text-brand-text-muted">
                    현재 연동된 캘린더가 없습니다. 캘린더를 연동하면 개인 약속
                    시간이 3단계에서 자동으로 필터링됩니다.
                  </p>
                </div>
              )}

              <div className="pt-4 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-brand-border-gray bg-white px-5 text-xs font-bold text-brand-text-secondary hover:bg-brand-bg-light transition-all"
                >
                  <ArrowLeft className="h-4 w-4" /> 이전
                </button>
                <PurpleButton
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 text-sm font-bold tracking-wide active:scale-95"
                >
                  다음 단계로 →
                </PurpleButton>
              </div>
            </div>
          )}

          {/* Step 3: 후보 시간대 비주얼 격자 선택기 */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <span className="text-lg font-extrabold text-brand-text-primary flex items-center gap-1.5">
                📅 후보 시간대 설정
              </span>
              <p className="text-xs text-brand-text-muted">
                조율 후보로 삼고 싶은 요일과 시간대를 드래그하거나 클릭하여
                칠해주세요.
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
                  <div
                    ref={gridRef}
                    className="min-w-[320px] grid grid-cols-8 gap-1 text-[10px] font-bold text-center select-none"
                  >
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
                            const isBusy =
                              blockBusyTimes && busySlots.includes(key);

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
                                  "h-8 rounded transition-all border cursor-pointer touch-none select-none relative",
                                  isBusy
                                    ? "bg-slate-100 border-slate-200 text-slate-400 pointer-events-none cursor-not-allowed flex items-center justify-center text-[8px] font-medium"
                                    : isSelected
                                      ? "bg-brand-purple text-white border-brand-purple shadow-sm hover:bg-brand-purple-hover"
                                      : "bg-white border-brand-border-gray hover:bg-brand-bg-light",
                                )}
                                title={
                                  isBusy
                                    ? "개인 일정 있음 (선택 불가)"
                                    : `${day.label} ${hour}:00 - ${hour + 1}:00`
                                }
                              >
                                {isBusy && "바쁨"}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
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
                <p
                  role="alert"
                  className="text-sm text-destructive font-semibold"
                >
                  {error}
                </p>
              ) : null}

              <div className="pt-4 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-brand-border-gray bg-white px-5 text-xs font-bold text-brand-text-secondary hover:bg-brand-bg-light transition-all"
                >
                  <ArrowLeft className="h-4 w-4" /> 이전
                </button>
                <PurpleButton
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    const mockEvent = {
                      preventDefault: () => {},
                    } as FormEvent<HTMLFormElement>;
                    handleSubmit(mockEvent);
                  }}
                  className="px-6 text-sm font-bold tracking-wide active:scale-95"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "생성 중..." : "초대 링크 만들기 🚀"}
                </PurpleButton>
              </div>
            </div>
          )}
        </form>

        {/* Step 4: 생성 완료 & 링크 공유 */}
        {step === 4 && links && (
          <section className="rounded-[2rem] border border-brand-border-muted bg-white p-6 sm:p-8 text-center shadow-premium-lg transition-all animate-bounceOnce">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-bg-muted text-brand-purple shadow-inner">
              <CheckCircle2 className="h-10 w-10" />
            </span>
            <h2 className="mt-5 text-3xl font-extrabold text-brand-text-primary">
              초대 링크가 준비됐습니다! 🎉
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
                      href="/signup?redirect=/dashboard"
                      className="inline-flex h-9 items-center justify-center rounded-xl bg-brand-purple px-8 text-xs font-bold text-white hover:bg-brand-purple-hover transition-all hover:scale-[1.02] shadow-sm no-underline"
                    >
                      3초 만에 모임 저장하고 시작하기
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* 스크린 리더 전용 복사 완료 알림 */}
            <div aria-live="polite" className="sr-only">
              {participantCopied && "참여자 링크가 클립보드에 복사되었습니다"}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                data-testid="copy-participant-link-bottom"
                onClick={() => copyParticipant(links.participant)}
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
                href={`${links.participant}${links.participant.includes("?") ? "&" : "?"}participate=1`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-12 w-full rounded-xl border-brand-border-muted text-brand-purple font-bold shadow-sm hover:bg-brand-bg-light",
                )}
              >
                일정 등록하기
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
        )}
      </section>
    </MoimShell>
  );
}

function validateScheduleForm({
  candidateDays,
  candidateStartHour,
  candidateEndHour,
  durationMinutes,
  candidateStartDate,
  candidateEndDate,
  responseDeadline,
}: {
  candidateDays: DayCode[];
  candidateStartHour: string;
  candidateEndHour: string;
  durationMinutes: string;
  candidateStartDate: string;
  candidateEndDate: string;
  responseDeadline: string;
}) {
  if (candidateDays.length === 0) {
    throw new Error("후보 요일을 하나 이상 선택해 주세요.");
  }
  if (Number(candidateEndHour) <= Number(candidateStartHour)) {
    throw new Error("종료 시간은 시작 시간보다 늦어야 합니다.");
  }
  const duration = Number(durationMinutes);
  if (duration < 15 || duration > 480) {
    throw new Error("소요 시간은 15분에서 480분 사이여야 합니다.");
  }

  if (candidateStartDate && candidateEndDate) {
    if (new Date(candidateStartDate) > new Date(candidateEndDate)) {
      throw new Error("후보 날짜 범위의 종료일은 시작일 이후여야 합니다.");
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(candidateStartDate) < today) {
      throw new Error("후보 날짜는 과거일 수 없습니다.");
    }
  }

  if (responseDeadline) {
    const deadlineDate = new Date(responseDeadline);
    if (deadlineDate <= new Date()) {
      throw new Error("응답 마감일은 현재 시간 이후여야 합니다.");
    }
    if (candidateEndDate) {
      const endOfDay = new Date(candidateEndDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (deadlineDate > endOfDay) {
        throw new Error("응답 마감일은 후보 날짜 범위 내에 있어야 합니다.");
      }
    }
  }
}

function useCopyFeedback(resetMs = 1800) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetMsRef = useRef(resetMs);

  useEffect(() => {
    resetMsRef.current = resetMs;
  }, [resetMs]);

  const copy = useCallback(async (value: string) => {
    const ok = await copyText(value);
    if (ok) {
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(
        () => setCopied(false),
        resetMsRef.current,
      );
    }
    return ok;
  }, []);

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
  const { copied, copy } = useCopyFeedback();

  return (
    <label className="grid gap-2 text-sm font-bold text-brand-text-secondary">
      <span className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-brand-purple" />
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
