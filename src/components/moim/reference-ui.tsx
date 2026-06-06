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

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/calendar/connect", label: "캘린더", icon: CalendarDays },
  { href: "/schedule/create", label: "모임", icon: Users },
  { href: "/login", label: "설정", icon: Settings },
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
    <header className="relative border-b border-[#f0eaf6] bg-[#fcf7ff] z-50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-5">
          {closeHref ? (
            <Link
              href={closeHref}
              aria-label="닫기"
              className="inline-flex h-9 w-9 items-center justify-center text-[#222]"
            >
              <X className="h-5 w-5" />
            </Link>
          ) : null}
          <Link href="/" className="text-2xl font-extrabold text-[#6252ac]">
            MOIM
          </Link>
        </div>

        {help ? (
          <HelpCircle className="h-6 w-6 text-[#6f6a73]" />
        ) : (
          <>
            <nav className="hidden items-center gap-7 text-[#6f6a73] sm:flex">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className={cn(
                    "rounded-full p-2 transition-colors hover:bg-[#f0eaf8]",
                    item.href === activeHref ? "text-[#6252ac]" : "",
                  )}
                >
                  <item.icon className="h-6 w-6" />
                </Link>
              ))}

              {loading ? (
                <div className="h-10 w-10 animate-pulse rounded-full bg-[#f4f0fb] border border-[#eee8f4]" />
              ) : user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#6252ac] text-lg font-semibold text-white transition-all hover:scale-105 active:scale-95 shadow-sm border border-[#524396]"
                  >
                    {user.nickname ? user.nickname[0] : "유"}
                  </button>
                  {showDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowDropdown(false)}
                      />
                      <div className="absolute right-0 mt-2.5 w-60 rounded-2xl border border-[#eee8f5] bg-white p-4.5 shadow-premium-lg z-20 animate-in fade-in-50 slide-in-from-top-1 duration-200">
                        <div className="border-b border-[#f3eefd] pb-3">
                          <p className="font-extrabold text-[#252329] text-base">
                            {user.nickname}
                          </p>
                          <p className="text-xs font-semibold text-[#8a8490] mt-0.5 truncate">
                            {user.email}
                          </p>
                        </div>
                        <div className="grid gap-1.5 pt-3">
                          <Link
                            href="/calendar/connect"
                            onClick={() => setShowDropdown(false)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-[#5f5865] hover:bg-[#f5effc] hover:text-[#6252ac] transition-colors"
                          >
                            <CalendarDays className="h-4.5 w-4.5" />
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
                  className="rounded-xl bg-[#6252ac] px-4.5 py-2 text-sm font-bold text-white hover:bg-[#524396] transition-all hover:scale-[1.03] active:scale-95 shadow-sm"
                >
                  로그인
                </Link>
              )}
            </nav>

            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#6f6a73] hover:bg-[#f0eaf8] sm:hidden"
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
        <nav className="absolute left-0 right-0 border-b border-[#f0eaf6] bg-[#fcf7ff] px-6 py-4 shadow-lg sm:hidden">
          <div className="grid gap-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-4 rounded-xl p-3 font-semibold transition-colors hover:bg-[#f0eaf8]",
                  item.href === activeHref
                    ? "bg-[#e9ddff] text-[#6252ac]"
                    : "text-[#6f6a73]",
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}

            {!loading && (
              <div className="mt-2 border-t border-[#f0eaf6] pt-3">
                {user ? (
                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="font-extrabold text-[#252329] truncate text-sm">
                        {user.nickname}
                      </p>
                      <p className="text-xs text-[#8a8490] truncate">
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
                    className="flex items-center justify-center rounded-xl bg-[#6252ac] py-2.5 text-sm font-bold text-white hover:bg-[#524396]"
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
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn(
        "h-12 rounded-xl bg-[#8f7bd6] px-7 text-base font-semibold text-white shadow-[0_10px_18px_rgba(98,82,172,0.22)] hover:bg-[#7d68c9]",
        className,
      )}
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
    <main className={cn("min-h-screen bg-white text-[#222026]", className)}>
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
        <span className="text-[#7e68cd]">{label}</span>
        <span className="text-[#77727c]">{progress} 진행</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[#e2e2e2]">
        <div
          className="h-full rounded-full bg-[#927fd8]"
          style={{ width: progress }}
        />
      </div>
    </div>
  );
}

export function SchedulerPreview({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className={cn(
        "rounded-[2rem] border border-[#ede7f3] bg-white shadow-[0_24px_60px_rgba(95,82,130,0.18)]",
        compact ? "p-5" : "p-8",
      )}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-normal">통합 스케줄러</h2>
          <p className="mt-1 text-[#77727c]">
            선택한 기간의 일정을 한눈에 확인하세요.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {["10월 9일 (목)", "10월 11일 (목)"].map((date) => (
            <span
              key={date}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e7e0ee] bg-white px-4 text-sm font-semibold text-[#605b66]"
            >
              <CalendarDays className="h-4 w-4 text-[#8f7bd6]" />
              {date}
            </span>
          ))}
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#8f7bd6] text-white">
            <Search className="h-5 w-5" />
          </span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <CalendarBoard />
        <div className="overflow-hidden rounded-[1.75rem] border border-[#f0eaf6] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#f0eaf6] p-6">
            <h3 className="text-2xl font-bold">내 모임</h3>
            <span className="font-semibold text-[#8f7bd6]">모두 보기</span>
          </div>
          <div className="grid gap-4 p-6">
            {[
              ["UX 디자인 스터디", "멤버 8명 · 매주 수요일 20:00", "UX"],
              ["한강 러닝 크루", "멤버 24명 · 비정기 모임", "RUN"],
              ["Next.js 알고리즘 정복", "멤버 5명 · 매주 토요일 14:00", "‹›"],
            ].map(([title, meta, icon], index) => (
              <div
                key={title}
                className="flex items-center gap-4 rounded-2xl border border-[#eeeaf3] bg-white p-4"
              >
                <span
                  className={cn(
                    "inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-xl font-bold text-white",
                    index === 0
                      ? "bg-[#8f7bd6]"
                      : index === 1
                        ? "bg-[#cbc3ef]"
                        : "bg-[#5b5b63]",
                  )}
                >
                  {icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-bold">{title}</p>
                  <p className="truncate text-sm text-[#77727c]">{meta}</p>
                </div>
                <span className="text-2xl text-[#c8c2cc]">›</span>
              </div>
            ))}
            <Link
              href="/schedule/create"
              className="inline-flex h-14 items-center justify-center rounded-2xl border border-dashed border-[#d9d2e3] text-[#9a95a1]"
            >
              + 새로운 모임 탐색하기
            </Link>
          </div>
          <div className="grid grid-cols-2 bg-[#f8f2fb] py-5 text-center">
            <div>
              <p className="text-2xl font-extrabold text-[#6252ac]">12</p>
              <p className="text-sm text-[#77727c]">참여 중인 모임</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#333]">3</p>
              <p className="text-sm text-[#77727c]">대기 중인 일정</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CalendarBoard() {
  const blocks = [
    {
      title: "디자인 팀 주간 회의",
      time: "10:00 - 11:30",
      column: 0,
      row: 1,
      span: 1.4,
      colorClass: "bg-[#f3eef8] text-[#232026] border-l-[#8f7bd6]",
    },
    {
      title: "프론트엔드 코드 리뷰",
      time: "11:00 - 12:30",
      column: 1,
      row: 2,
      span: 1.35,
      colorClass: "bg-[#907ed6] text-white border-l-[#907ed6]",
    },
    {
      title: "점심 식사 (마케팅팀)",
      time: "",
      column: 0,
      row: 3,
      span: 0.9,
      colorClass: "bg-[#eee9ef] text-[#232026] border-l-[#999]",
    },
    {
      title: "러닝 크루 번개",
      time: "",
      column: 2,
      row: 0,
      span: 0.9,
      colorClass: "bg-[#e6e2f4] text-[#232026] border-l-[#8f7bd6]",
    },
  ];

  return (
    <div>
      <div className="overflow-x-auto scroller-style rounded-t-2xl border border-[#f0eaf6] bg-white text-sm">
        <div className="relative min-w-[650px] select-none">
          <div className="grid grid-cols-[72px_repeat(3,minmax(0,1fr))]">
            <div className="flex h-16 items-center justify-center bg-[#f5eff8] px-4 font-semibold text-[#8f8896]">
              Time
            </div>
            {["10/9 (수) 오늘", "10/10 (목)", "10/11 (금)"].map((day) => (
              <div
                key={day}
                className="flex h-16 items-center justify-center bg-[#f5eff8] px-4 text-center font-bold text-[#232026]"
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
            ].map((time) => (
              <div key={time} className="contents">
                <div className="flex h-20 items-center justify-center border-r border-t border-[#f0eaf6] px-2 text-xs font-semibold text-[#aaa5ad]">
                  {time}
                </div>
                <div className="h-20 border-r border-t border-[#f0eaf6]" />
                <div className="h-20 border-r border-t border-[#f0eaf6]" />
                <div className="h-20 border-t border-[#f0eaf6]" />
              </div>
            ))}
          </div>
          {blocks.map(({ title, time, column, row, span, colorClass }) => (
            <div
              key={title}
              className={cn(
                "absolute flex flex-col justify-center rounded-xl border-l-4 px-4 py-2 text-sm shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md cursor-pointer",
                colorClass,
              )}
              style={{
                left: `calc(72px + ${column} * ((100% - 72px) / 3) + 8px)`,
                top: `calc(64px + ${row} * 80px + 8px)`,
                width: `calc((100% - 72px) / 3 - 16px)`,
                height: `calc(${span} * 80px - 16px)`,
              }}
            >
              <p className="font-bold leading-snug">{title}</p>
              {time ? (
                <p className="mt-0.5 text-xs opacity-90">{time}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 flex items-center gap-5 text-sm text-[#5f5865]">
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 rounded-full bg-[#927fd8]" /> 업무: 3
        </span>
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 rounded-full bg-[#cbc3ef]" /> 모임: 1
        </span>
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
  ["bg-[#f1eef9]", "bg-[#ded8f1]", "bg-[#f5f3f7]"],
  ["bg-[#eeeaf7]", "bg-[#d6ceec]", "bg-[#f1eef9]"],
  ["bg-[#f7f6f7]", "bg-[#9683d5]", "bg-[#a998dd]"],
  ["bg-[#a998dd]", "bg-[#8f7bd6] ring-2 ring-white", "bg-[#b8ace4]"],
  ["bg-[#b9afe3]", "bg-[#a998dd]", "bg-[#ac9fdf]"],
  ["bg-[#c9c1eb]", "bg-[#ece8f7]", "bg-[#a99dde]"],
  ["bg-[#eeeaf7]", "bg-[#f0edf7]", "bg-[#c6bce8]"],
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
    <div className="overflow-x-auto scroller-style rounded-2xl border border-[#eee8f4] bg-[#fbf7ff] p-4 pt-5 shadow-inner">
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
              index === 1 ? "text-[#6f5ec8]" : "text-[#2b292f]",
            )}
          >
            {day}
          </div>
        ))}
        {rows.map((time, rowIndex) => (
          <div key={time} className="contents">
            <div className="flex h-7 items-center justify-end pr-2 text-right text-xs font-semibold text-[#aaa5ad]">
              {time}
            </div>
            {days.map((day, dayIndex) => {
              const tooltipText = cellTooltips?.[rowIndex]?.[dayIndex];
              return (
                <div
                  key={`${day}-${time}`}
                  className={cn(
                    "h-7 rounded-sm relative group cursor-pointer transition-all hover:scale-105 hover:shadow-sm",
                    colors[rowIndex]?.[dayIndex] ?? "bg-[#f5f3f7]",
                  )}
                >
                  {tooltipText && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 bg-[#252329] text-white text-xs font-semibold py-2 px-3 rounded-lg shadow-xl whitespace-nowrap pointer-events-none transition-all duration-200 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-[#252329]">
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
    google: "bg-white border-[#ece6ef]",
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
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f2eef9] text-sm font-bold text-[#7e68cd]">
      {children}
    </span>
  );
}

export function CalendarInfoCard() {
  return (
    <div className="rounded-[1.5rem] border border-[#eee8f4] bg-[#fbf7ff] p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">주말 독서 모임</h3>
          <p className="mt-2 text-lg text-[#5f5865]">
            <span className="font-bold text-[#6252ac]">김철수</span> 님이
            호스트입니다
          </p>
        </div>
        <span className="rounded-full bg-[#e6e0ea] px-5 py-2 text-[#6b6670]">
          현재 12명 중 8명 응답 완료
        </span>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <CalendarDays className="mb-4 h-7 w-7 text-[#6252ac]" />
          <p className="text-[#6b6670]">희망 기간</p>
          <p className="mt-2 text-xl font-bold">10월 12일 ~ 10월 18일</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <CalendarPlus className="mb-4 h-7 w-7 text-[#6252ac]" />
          <p className="text-[#6b6670]">소요 시간</p>
          <p className="mt-2 text-xl font-bold">약 2시간 소요 예정</p>
        </div>
      </div>
    </div>
  );
}
