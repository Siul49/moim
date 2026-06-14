"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { ComponentProps, ReactNode } from "react";
import {
  CalendarDays,
  CalendarPlus,
  HelpCircle,
  Home,
  Search,
  Settings,
  Users,
  X,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ScheduleItem = {
  id: string;
  title: string;
  status: string;
  createdAt: Date | string;
  confirmedSlot?: string | null;
  durationMinutes: number;
  candidateDays: string;
  candidateStartHour: number;
  candidateEndHour: number;
};

const CONFIRMED_DAY_LABELS: Record<string, string> = {
  MON: "월요일",
  TUE: "화요일",
  WED: "수요일",
  THU: "목요일",
  FRI: "금요일",
  SAT: "토요일",
  SUN: "일요일",
};

// confirmedSlot은 {day, startHour, endHour} 형태의 요일 기반 슬롯 JSON 문자열이다.
// new Date()로는 파싱되지 않으므로(Invalid Date) 슬롯을 파싱해 사람이 읽을 수 있는
// "수요일 14:00-15:00" 형식으로 변환한다. 파싱 실패 시 null을 반환한다.
function formatConfirmedSlot(raw: string): string | null {
  try {
    const slot = JSON.parse(raw) as {
      day?: string;
      startHour?: number;
      endHour?: number;
    };
    if (
      !slot ||
      typeof slot.day !== "string" ||
      typeof slot.startHour !== "number" ||
      typeof slot.endHour !== "number"
    ) {
      return null;
    }
    const dayLabel = CONFIRMED_DAY_LABELS[slot.day] ?? slot.day;
    const pad = (hour: number) => String(hour).padStart(2, "0");
    return `${dayLabel} ${pad(slot.startHour)}:00-${pad(slot.endHour)}:00`;
  } catch {
    return null;
  }
}

const NAV_ITEMS = [
  { href: "/", label: "홈으로 가기", icon: Home },
  { href: "/calendar/connect", label: "캘린더 등록하기", icon: CalendarDays },
  { href: "/schedule/create", label: "모임 만들기", icon: Users },
  { href: "/dashboard/settings", label: "설정", icon: Settings },
];

export function MoimTopBar({
  closeHref,
  help = false,
  activeHref = "/",
}: {
  closeHref?: string;
  help?: boolean;
  activeHref?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<{ nickname: string; email: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setShowDropdown(false);
      window.location.href = "/";
    } catch (e) {
      console.error("[Logout Error]:", e);
    }
  };

  return (
    <header className="relative border-b border-brand-border-muted bg-brand-bg-light z-50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-5">
          {closeHref ? (
            <Link
              href={closeHref}
              aria-label="닫기"
              className="inline-flex h-9 w-9 items-center justify-center text-brand-text-primary"
            >
              <X className="h-5 w-5" />
            </Link>
          ) : null}
          <Link href="/" className="text-2xl font-extrabold text-brand-purple">
            MOIM
          </Link>
        </div>

        {help ? (
          <HelpCircle className="h-6 w-6 text-brand-text-secondary" />
        ) : (
          <>
            <nav className="hidden items-center gap-7 text-brand-text-secondary sm:flex">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className={cn(
                    "group relative inline-flex items-center justify-center rounded-full p-2 transition-all duration-200 hover:scale-110 active:scale-95",
                    item.href === activeHref
                      ? "text-brand-purple"
                      : "text-brand-text-secondary hover:text-brand-purple",
                  )}
                  onClick={(e) => {
                    if (item.href === "#") e.preventDefault();
                  }}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="pointer-events-none absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2.5 py-1 text-[11px] font-bold text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                    {item.label}
                  </span>
                </Link>
              ))}

              {loading ? (
                <div className="h-10 w-10 animate-pulse rounded-full bg-brand-bg-muted border border-brand-border-muted" />
              ) : user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-purple text-lg font-semibold text-white transition-all hover:scale-105 active:scale-95 shadow-sm border border-brand-purple-dark"
                  >
                    {user.nickname ? user.nickname[0] : "유"}
                  </button>
                  {showDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowDropdown(false)}
                      />
                      <div className="absolute right-0 mt-2.5 w-60 rounded-2xl border border-brand-border-muted bg-white p-5 shadow-premium-lg z-20 animate-in fade-in-50 slide-in-from-top-1 duration-200">
                        <div className="border-b border-brand-border-muted pb-3">
                          <p className="font-extrabold text-brand-text-primary text-base">
                            {user.nickname}
                          </p>
                          <p className="text-xs font-semibold text-brand-text-muted mt-0.5 truncate">
                            {user.email}
                          </p>
                        </div>
                        <div className="grid gap-1.5 pt-3">
                          <Link
                            href="/calendar/connect"
                            onClick={() => setShowDropdown(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-brand-text-secondary hover:bg-brand-bg-muted hover:text-brand-purple transition-colors"
                          >
                            <CalendarDays className="h-4 w-4" />
                            캘린더 연동 관리
                          </Link>
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-destructive hover:bg-destructive/5 transition-colors text-left"
                          >
                            로그아웃
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="inline-block rounded-xl text-sm font-bold text-brand-purple hover:text-brand-purple-hover hover:scale-105 active:scale-95 transition-all duration-200 px-5 py-2 no-underline"
                >
                  로그인
                </Link>
              )}
            </nav>

            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-brand-text-secondary hover:scale-110 active:scale-95 transition-all duration-200 sm:hidden"
              aria-expanded={isOpen}
              aria-label="메뉴 토글"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </>
        )}
      </div>

      {!help && isOpen && (
        <nav className="absolute left-0 right-0 border-b border-brand-border-muted bg-brand-bg-light px-6 py-4 shadow-lg sm:hidden">
          <div className="grid gap-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  if (item.href === "#") {
                    e.preventDefault();
                    return;
                  }
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center gap-4 rounded-xl p-3 font-semibold transition-colors hover:bg-brand-bg-muted",
                  item.href === activeHref
                    ? "bg-brand-purple-ring text-brand-purple"
                    : "text-brand-text-secondary",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}

            {!loading && (
              <div className="mt-2 border-t border-brand-border-muted pt-3">
                {user ? (
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="font-extrabold text-brand-text-primary truncate text-sm">
                        {user.nickname}
                      </p>
                      <p className="text-xs text-brand-text-muted truncate">
                        {user.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                      className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/20 shrink-0"
                    >
                      로그아웃
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center rounded-xl bg-brand-purple py-2.5 text-sm font-bold text-white hover:bg-brand-purple-hover transition-all active:scale-[0.98]"
                  >
                    로그인
                  </Link>
                )}
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

export function PurpleButton({
  children,
  className,
  variant = "tintBrand",
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      variant={variant}
      className={cn("h-12 rounded-xl px-7 text-base font-semibold", className)}
      {...props}
    >
      {children}
    </Button>
  );
}

export function MoimShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn("min-h-screen bg-white text-brand-text-primary", className)}
    >
      {children}
    </main>
  );
}

export function ProgressHeader({
  label,
  progress,
}: {
  label: string;
  progress: string;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 pt-12">
      <div className="mb-3 flex items-center justify-between text-lg font-semibold">
        <span className="text-brand-purple-light">{label}</span>
        <span className="text-brand-text-muted">{progress} 진행</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-brand-border-gray">
        <div
          className="h-full rounded-full bg-brand-purple-light"
          style={{ width: progress }}
        />
      </div>
    </div>
  );
}

export function SchedulerPreview({
  compact = false,
  schedules = [],
}: {
  compact?: boolean;
  schedules?: ScheduleItem[];
}) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeDays, setActiveDays] = useState<Date[]>([]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const format = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    setStartDate(format(today));
    setEndDate(format(dayAfter));
    setActiveDays([today, tomorrow, dayAfter]);
  }, []);

  const handleSearch = () => {
    if (!startDate || !endDate) return;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return;

    const days: Date[] = [];
    const current = new Date(start);
    let count = 0;
    while (current <= end && count < 7) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
      count++;
    }
    setActiveDays(days);
  };

  return (
    <section
      className={cn(
        "rounded-[2rem] border border-brand-border-muted bg-white shadow-[0_24px_60px_rgba(95,82,130,0.18)]",
        compact ? "p-5" : "p-8",
      )}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-normal">통합 스케줄러</h2>
          <p className="mt-1 text-brand-text-muted">
            선택한 기간의 일정을 한눈에 확인하세요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-brand-border-muted bg-white px-4 text-sm font-semibold text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-purple"
          />
          <span className="text-brand-text-muted">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-brand-border-muted bg-white px-4 text-sm font-semibold text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-purple"
          />
          <button
            onClick={handleSearch}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-purple-light text-white hover:bg-brand-purple transition-colors cursor-pointer"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <CalendarBoard days={activeDays} schedules={schedules} />
        <div className="min-w-0 flex flex-col overflow-hidden rounded-[1.75rem] border border-brand-border-muted bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-brand-border-muted p-6">
            <h3 className="text-2xl font-bold">내 모임</h3>
            <Link
              href="/dashboard/meetings"
              className="font-semibold text-brand-purple-light no-underline hover:text-brand-purple transition-colors cursor-pointer"
            >
              모두 보기
            </Link>
          </div>
          <div className="flex flex-col gap-4 p-6 w-full">
            {schedules.length === 0 ? (
              <div className="text-center py-8 text-brand-text-muted text-sm">
                생성된 모임이 없습니다.
              </div>
            ) : (
              schedules.slice(0, 3).map((sched, index) => {
                const icon = sched.title.substring(0, 2).toUpperCase();
                const isConfirmed = sched.status === "confirmed";
                const confirmedLabel =
                  isConfirmed && sched.confirmedSlot
                    ? formatConfirmedSlot(sched.confirmedSlot)
                    : null;
                const meta = confirmedLabel
                  ? `확정: ${confirmedLabel}`
                  : `생성일: ${new Date(sched.createdAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })} · 조율 중`;

                return (
                  <Link
                    key={sched.id}
                    href={`/schedule/${sched.id}`}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-brand-border-muted bg-white p-4 no-underline hover:border-brand-purple transition-colors w-full overflow-hidden"
                  >
                    <span
                      className={cn(
                        "inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-xl font-bold text-white",
                        index === 0
                          ? "bg-brand-purple-light"
                          : index === 1
                            ? "bg-brand-purple-light/40"
                            : "bg-brand-text-muted",
                      )}
                    >
                      {icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-lg font-bold text-brand-text-primary">
                        {sched.title}
                      </p>
                      <p className="truncate text-sm text-brand-text-muted">
                        {meta}
                      </p>
                    </div>
                    <span className="text-2xl text-brand-text-light">›</span>
                  </Link>
                );
              })
            )}
            <Link
              href="/dashboard/meetings"
              className="inline-flex h-14 items-center justify-center rounded-2xl border border-dashed border-brand-border-muted text-brand-text-light no-underline hover:border-brand-purple hover:text-brand-purple transition-colors font-semibold"
            >
              모든 모임 탐색하기
            </Link>
          </div>
          <div className="grid grid-cols-2 bg-brand-bg-muted py-5 text-center">
            <div>
              <p className="text-2xl font-extrabold text-brand-purple">
                {schedules.filter((s) => s.status === "confirmed").length}
              </p>
              <p className="text-sm text-brand-text-muted">참여 중인 모임</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-brand-text-primary">
                {schedules.filter((s) => s.status !== "confirmed").length}
              </p>
              <p className="text-sm text-brand-text-muted">대기 중인 일정</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CalendarBoard({
  days = [],
  schedules = [],
}: {
  days?: Date[];
  schedules?: ScheduleItem[];
}) {
  if (days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[1.75rem] border border-brand-border-muted bg-brand-bg-light/30 h-full min-h-[400px] text-center p-8">
        <CalendarDays className="h-12 w-12 text-brand-text-light mb-4" />
        <p className="text-xl font-bold text-brand-text-primary">
          조회할 기간을 선택해주세요
        </p>
        <p className="text-sm text-brand-text-muted mt-2">
          우측 상단에서 시작일과 종료일을 지정하고 검색 아이콘을 누르면
          <br />
          선택한 기간의 내 모임 일정이 표시됩니다.
        </p>
      </div>
    );
  }

  const dayStrings = days.map((d) => {
    const month = d.getMonth() + 1;
    const date = d.getDate();
    const day = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
    return `${month}/${date} (${day})`;
  });

  const blocks: {
    title: string;
    time: string;
    column: number;
    row: number;
    span: number;
    colorClass: string;
  }[] = [];
  schedules.forEach((s) => {
    if (s.confirmedSlot) {
      const slotDate = new Date(s.confirmedSlot);
      const dayIndex = days.findIndex(
        (d) =>
          d.getFullYear() === slotDate.getFullYear() &&
          d.getMonth() === slotDate.getMonth() &&
          d.getDate() === slotDate.getDate(),
      );
      if (dayIndex !== -1) {
        const startHour = slotDate.getHours() + slotDate.getMinutes() / 60;
        blocks.push({
          title: s.title,
          time: `${slotDate.getHours().toString().padStart(2, "0")}:${slotDate.getMinutes().toString().padStart(2, "0")} 확정`,
          column: dayIndex,
          row: startHour - 9,
          span: s.durationMinutes / 60,
          colorClass:
            "bg-brand-purple-light text-white border-l-brand-purple-light shadow-sm",
        });
      }
    } else if (s.candidateDays) {
      const candidateDates = s.candidateDays.split(",");
      candidateDates.forEach((dateStr: string) => {
        const slotDate = new Date(dateStr);
        const dayIndex = days.findIndex(
          (d) =>
            d.getFullYear() === slotDate.getFullYear() &&
            d.getMonth() === slotDate.getMonth() &&
            d.getDate() === slotDate.getDate(),
        );
        if (dayIndex !== -1) {
          blocks.push({
            title: s.title,
            time: "조율 중",
            column: dayIndex,
            row: s.candidateStartHour - 9,
            span: s.candidateEndHour - s.candidateStartHour,
            colorClass:
              "bg-brand-bg-muted text-brand-text-primary border-l-brand-text-light border-dashed opacity-80",
          });
        }
      });
    }
  });

  return (
    <div>
      <div className="overflow-x-auto scroller-style rounded-[1.75rem] border border-brand-border-muted bg-white text-sm shadow-sm">
        <div className="relative min-w-[650px] select-none">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `72px repeat(${days.length}, minmax(0,1fr))`,
            }}
          >
            <div className="flex h-16 items-center justify-center bg-brand-bg-muted px-4 font-semibold text-brand-text-muted border-b border-r border-brand-border-muted">
              Time
            </div>
            {dayStrings.map((day, i) => (
              <div
                key={day}
                className={cn(
                  "flex h-16 items-center justify-center bg-brand-bg-muted px-4 text-center font-bold text-brand-text-primary border-b border-brand-border-muted",
                  i !== days.length - 1 && "border-r",
                )}
              >
                {day}
              </div>
            ))}
            {[
              "09:00",
              "10:00",
              "11:00",
              "12:00",
              "13:00",
              "14:00",
              "15:00",
              "16:00",
              "17:00",
            ].map((time) => (
              <div key={time} className="contents">
                <div className="flex h-20 items-center justify-center border-r border-b border-brand-border-muted px-2 text-xs font-semibold text-brand-text-light bg-brand-bg-light/20">
                  {time}
                </div>
                {days.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-20 border-b border-brand-border-muted",
                      i !== days.length - 1 && "border-r",
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
          {blocks.map(({ title, time, column, row, span, colorClass }, i) => (
            <div
              key={`${title}-${i}`}
              className={cn(
                "absolute flex flex-col justify-center rounded-xl border-l-4 px-4 py-2 text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md cursor-pointer overflow-hidden",
                colorClass,
              )}
              style={{
                left: `calc(72px + ${column} * ((100% - 72px) / ${days.length}) + 8px)`,
                top: `calc(64px + ${row} * 80px + 8px)`,
                width: `calc((100% - 72px) / ${days.length} - 16px)`,
                height: `calc(${span} * 80px - 16px)`,
              }}
            >
              <p className="font-bold leading-snug truncate">{title}</p>
              {time ? (
                <p className="mt-0.5 text-xs opacity-90 truncate">{time}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const DEFAULT_HEATMAP_ROWS = [
  "09:00",
  "11:00",
  "13:00",
  "15:00",
  "17:00",
  "19:00",
  "21:00",
];
const DEFAULT_HEATMAP_DAYS = ["11/23 (목)", "11/24 (금)", "11/25 (토)"];
const DEFAULT_HEATMAP_COLORS = [
  ["bg-brand-purple/10", "bg-brand-purple/30", "bg-brand-purple/5"],
  ["bg-brand-purple/15", "bg-brand-purple/40", "bg-brand-purple/10"],
  ["bg-brand-purple/5", "bg-brand-purple/70", "bg-brand-purple/60"],
  [
    "bg-brand-purple/60",
    "bg-brand-purple/90 ring-2 ring-white",
    "bg-brand-purple/50",
  ],
  ["bg-brand-purple/50", "bg-brand-purple/60", "bg-brand-purple/55"],
  ["bg-brand-purple/40", "bg-brand-purple/20", "bg-brand-purple/60"],
  ["bg-brand-purple/15", "bg-brand-purple/10", "bg-brand-purple/45"],
];

export function HeatmapGrid({
  className,
  rows = DEFAULT_HEATMAP_ROWS,
  days = DEFAULT_HEATMAP_DAYS,
  colors = DEFAULT_HEATMAP_COLORS,
  cellTooltips,
}: {
  className?: string;
  rows?: string[];
  days?: string[];
  colors?: string[][];
  cellTooltips?: string[][];
}) {
  return (
    <div className="overflow-x-auto scroller-style rounded-2xl border border-brand-border-muted bg-brand-bg-light p-4 pt-5 shadow-inner">
      <div
        className={cn("grid gap-2 select-none", className)}
        style={{
          gridTemplateColumns: `58px repeat(${days.length}, minmax(0, 1fr))`,
          minWidth: `${Math.max(440, days.length * 90)}px`,
        }}
      >
        <div />
        {days.map((day, index) => (
          <div
            key={day}
            className={cn(
              "pb-2 text-center text-sm font-bold flex items-center justify-center",
              index === 1 ? "text-brand-purple" : "text-brand-text-primary",
            )}
          >
            {day}
          </div>
        ))}
        {rows.map((time, rowIndex) => (
          <div key={time} className="contents">
            <div className="flex h-7 items-center justify-end pr-2 text-right text-xs font-semibold text-brand-text-light">
              {time}
            </div>
            {days.map((day, dayIndex) => {
              const tooltipText = cellTooltips?.[rowIndex]?.[dayIndex];
              return (
                <div
                  key={`${day}-${time}`}
                  className={cn(
                    "h-7 rounded-sm relative group cursor-pointer transition-all hover:scale-105 hover:shadow-sm",
                    colors[rowIndex]?.[dayIndex] ?? "bg-brand-purple/5",
                  )}
                >
                  {tooltipText && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 bg-brand-text-primary text-white text-xs font-semibold py-2 px-3 rounded-lg shadow-xl whitespace-nowrap pointer-events-none transition-all duration-200 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-brand-text-primary">
                      {tooltipText}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProviderGlyph({
  type,
}: {
  type: "google" | "apple" | "everytime" | "ics" | "kakao" | "naver";
}) {
  const className = {
    google: "bg-white border-brand-border-muted",
    apple: "bg-[#111] text-white border-[#111]",
    everytime: "bg-[#f03c36] text-white border-[#f03c36]",
    ics: "bg-[#7c7484] text-white border-[#7c7484]",
    kakao: "bg-[#fee500] text-[#191919] border-[#fee500]",
    naver: "bg-[#03c75a] text-white border-[#03c75a]",
  }[type];

  const renderIcon = () => {
    switch (type) {
      case "google":
        return (
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        );
      case "apple":
        return (
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
          >
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.52-.63.73-1.18 1.87-1.03 2.97 1.12.09 2.28-.58 2.98-1.43z" />
          </svg>
        );
      case "everytime":
        return (
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
          >
            <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm3.5 10h-5.4c.1 1 .8 1.6 1.9 1.6.8 0 1.4-.4 1.6-.9h2.1c-.3 1.6-1.7 2.8-3.7 2.8-2.4 0-4-1.6-4-4.5s1.6-4.5 4-4.5c2.3 0 3.6 1.6 3.6 4.1v1.4zm-2.1-1.6c0-.9-.6-1.5-1.5-1.5s-1.5.6-1.6 1.5h3.1z" />
          </svg>
        );
      case "ics":
        return (
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        );
      case "kakao":
        return (
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
          >
            <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.707 4.8 4.27 6.054-.277.96-.997 3.456-1.042 3.636-.06.24.08.24.17.18.07-.05 1.124-.763 3.12-2.112.805.112 1.637.172 2.482.172 4.97 0 9-3.185 9-7.115S16.97 3 12 3z" />
          </svg>
        );
      case "naver":
        return (
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
          >
            <path d="M16.273 19.167L7.697 6.782V19.17H3V4.83h4.727L16.303 17.21V4.83H21v14.337z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <span
      className={cn(
        "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border",
        className,
      )}
    >
      {renderIcon()}
    </span>
  );
}

export function EmptyAvatar({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-bg-muted text-sm font-bold text-brand-purple">
      {children}
    </span>
  );
}

export function CalendarInfoCard() {
  return (
    <div className="rounded-[1.5rem] border border-brand-border-muted bg-brand-bg-light p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">주말 독서 모임</h3>
          <p className="mt-2 text-lg text-brand-text-secondary">
            <span className="font-bold text-brand-purple">김철수</span> 님이
            호스트입니다
          </p>
        </div>
        <span className="rounded-full bg-brand-bg-muted px-5 py-2 text-brand-text-secondary">
          현재 12명 중 8명 응답 완료
        </span>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <CalendarDays className="mb-4 h-7 w-7 text-brand-purple" />
          <p className="text-brand-text-secondary">희망 기간</p>
          <p className="mt-2 text-xl font-bold">10월 12일 ~ 10월 18일</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <CalendarPlus className="mb-4 h-7 w-7 text-brand-purple" />
          <p className="text-brand-text-secondary">소요 시간</p>
          <p className="mt-2 text-xl font-bold">약 2시간 소요 예정</p>
        </div>
      </div>
    </div>
  );
}
