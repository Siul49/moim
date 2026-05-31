import Link from "next/link";
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
  return (
    <header className="h-16 border-b border-[#f0eaf6] bg-[#fcf7ff]">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
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
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f0fb] text-lg font-semibold text-[#6252ac]">
              지
            </span>
          </nav>
        )}
      </div>
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
      <div className="relative overflow-hidden rounded-t-2xl border border-[#f0eaf6] bg-white text-sm">
        <div className="grid grid-cols-[72px_repeat(3,minmax(0,1fr))]">
          <div className="h-16 bg-[#f5eff8] p-4 text-[#9a95a1]">Time</div>
          {["10/9 수 오늘", "10/10 목 10", "10/11 금 11"].map((day) => (
            <div
              key={day}
              className="h-16 bg-[#f5eff8] p-4 text-center font-bold"
            >
              {day}
            </div>
          ))}
          {["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"].map(
            (time) => (
              <div key={time} className="contents">
                <div className="h-20 border-r border-t border-[#f0eaf6] p-4 text-[#aaa5ad]">
                  {time}
                </div>
                <div className="h-20 border-r border-t border-[#f0eaf6]" />
                <div className="h-20 border-r border-t border-[#f0eaf6]" />
                <div className="h-20 border-t border-[#f0eaf6]" />
              </div>
            ),
          )}
        </div>
        {blocks.map(({ title, time, column, row, span, colorClass }) => (
          <div
            key={title}
            className={cn(
              "absolute rounded-xl border-l-4 p-4 text-sm shadow-sm",
              colorClass,
            )}
            style={{
              left: `calc(72px + ${column} * ((100% - 72px) / 3) + 8px)`,
              top: `calc(64px + ${row} * 80px + 8px)`,
              width: `calc((100% - 72px) / 3 - 16px)`,
              height: `calc(${span} * 80px - 16px)`,
            }}
          >
            <p className="font-bold">{title}</p>
            {time ? <p className="mt-1 text-xs">{time}</p> : null}
          </div>
        ))}
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
}: {
  className?: string;
  rows?: string[];
  days?: string[];
  colors?: string[][];
}) {
  return (
    <div
      className={cn("grid gap-2", className)}
      style={{
        gridTemplateColumns: `58px repeat(${days.length}, minmax(0, 1fr))`,
      }}
    >
      <div />
      {days.map((day, index) => (
        <div
          key={day}
          className={cn(
            "pb-2 text-center text-lg font-bold",
            index === 1 ? "text-[#6f5ec8]" : "text-[#2b292f]",
          )}
        >
          {day}
        </div>
      ))}
      {rows.map((time, rowIndex) => (
        <div key={time} className="contents">
          <div className="text-right text-sm text-[#aaa5ad]">{time}</div>
          {days.map((day, dayIndex) => (
            <div
              key={`${day}-${time}`}
              className={cn(
                "h-7 rounded-sm",
                colors[rowIndex]?.[dayIndex] ?? "bg-[#f5f3f7]",
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ProviderGlyph({
  type,
}: {
  type: "google" | "apple" | "everytime" | "ics" | "kakao" | "naver";
}) {
  const label = {
    google: "G",
    apple: "A",
    everytime: "e",
    ics: "▣",
    kakao: "talk",
    naver: "N",
  }[type];
  const className = {
    google: "bg-white text-[#4285f4] border-[#ece6ef]",
    apple: "bg-white text-black border-[#ece6ef]",
    everytime: "bg-white text-[#111] border-[#ece6ef]",
    ics: "bg-white text-[#777] border-[#ece6ef]",
    kakao: "bg-[#fee500] text-[#191919] border-[#fee500]",
    naver: "bg-[#03c75a] text-white border-[#03c75a]",
  }[type];
  return (
    <span
      className={cn(
        "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-lg font-extrabold",
        className,
      )}
    >
      {label}
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
