"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  Palette,
  Layers,
  CalendarRange,
  SquareTerminal,
  ExternalLink,
} from "lucide-react";
import { TermsModal, type TermsKey } from "@/components/moim/TermsModal";
import { AuthProviderGlyph } from "@/components/moim/auth-social";
import {
  MoimShell,
  MoimTopBar,
  PurpleButton,
  ProgressHeader,
  SchedulerPreview,
  CalendarBoard,
  HeatmapGrid,
  ProviderGlyph,
  EmptyAvatar,
  CalendarInfoCard,
} from "@/components/moim/reference-ui";

export default function ReferencePage() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "buttons" | "layout" | "scheduler" | "modals"
  >("overview");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // States for interactive components
  const [progressVal, setProgressVal] = useState("45%");
  const [termsModalKey, setTermsModalKey] = useState<TermsKey | null>(null);
  const [testInput, setTestInput] = useState("");
  const [testSelect, setTestSelect] = useState("option1");

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const tabs = [
    { id: "overview", label: "디자인 토큰 & 색상", icon: Palette },
    { id: "buttons", label: "버튼 & 컨트롤", icon: SquareTerminal },
    { id: "layout", label: "레이아웃 & 쉘", icon: Layers },
    { id: "scheduler", label: "스케줄러 & 캘린더", icon: CalendarRange },
    { id: "modals", label: "모달 & 팝업", icon: ExternalLink },
  ] as const;

  return (
    <MoimShell className="bg-brand-bg-light">
      <header className="border-b border-brand-border-muted bg-white py-6 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-purple text-white shadow-md font-bold">
              M
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-brand-text-primary">
                MOIM 컴포넌트 사전
              </h1>
              <p className="text-xs font-semibold text-brand-text-muted">
                MOIM 디자인 시스템의 핵심 컴포넌트와 가이드라인
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-brand-border-gray px-4 py-2 text-sm font-bold text-brand-text-secondary hover:bg-brand-bg-muted transition-all"
          >
            랜딩페이지로 이동
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="h-fit rounded-2xl border border-brand-border-muted bg-white p-4 shadow-sm">
            <p className="mb-4 px-3 text-xs font-bold uppercase tracking-wider text-brand-text-light">
              카테고리
            </p>
            <nav className="grid gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition-all duration-200 ${
                      isActive
                        ? "bg-brand-purple text-white shadow-md shadow-brand-purple/25"
                        : "text-brand-text-secondary hover:bg-brand-bg-muted hover:text-brand-purple"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="min-w-0">
            {/* TAB: OVERVIEW */}
            {activeTab === "overview" && (
              <section className="grid gap-8">
                <div className="rounded-2xl border border-brand-border-muted bg-white p-6 shadow-sm">
                  <h2 className="text-2xl font-extrabold text-brand-text-primary mb-2">
                    디자인 토큰 시스템
                  </h2>
                  <p className="text-sm font-medium text-brand-text-secondary leading-relaxed">
                    MOIM은 CSS HSL 변수 체계를 통해 라이트 모드 및 다크 모드를
                    일관되게 지원하고 테마를 관리합니다. 하드코딩된 `#hex` 대신
                    확장 가능한 Tailwind 유틸리티 클래스 형태로 사용합니다.
                  </p>
                </div>

                {/* Primary Theme Colors */}
                <div className="grid gap-6">
                  <h3 className="text-lg font-extrabold text-brand-text-primary">
                    브랜드 테마 컬러 (Brand Theme)
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    {[
                      {
                        name: "Brand Purple",
                        cls: "bg-brand-purple",
                        var: "var(--brand-purple)",
                        desc: "브랜드 기본 보라색 / 핵심 CTA 배경",
                      },
                      {
                        name: "Brand Purple Light",
                        cls: "bg-brand-purple-light",
                        var: "var(--brand-purple-light)",
                        desc: "보라색 강조 / 보조 포인트 영역",
                      },
                      {
                        name: "Brand Purple Dark",
                        cls: "bg-brand-purple-dark",
                        var: "var(--brand-purple-dark)",
                        desc: "버튼 호버 및 클릭 액션 피드백",
                      },
                      {
                        name: "Brand Purple Bg",
                        cls: "bg-brand-purple-bg border border-brand-purple/20",
                        var: "var(--brand-purple-bg)",
                        desc: "은은한 보라색 배경 톤",
                      },
                    ].map((col) => (
                      <div
                        key={col.name}
                        className="rounded-2xl border border-brand-border-muted bg-white p-4 shadow-sm"
                      >
                        <div
                          className={`h-20 w-full rounded-xl mb-3 ${col.cls}`}
                        />
                        <p className="text-sm font-extrabold text-brand-text-primary">
                          {col.name}
                        </p>
                        <p className="text-xs font-mono text-brand-text-muted mt-1 select-all">
                          {col.var}
                        </p>
                        <p className="text-[11px] text-brand-text-light mt-1.5 leading-normal font-semibold">
                          {col.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Backgrounds & Borders */}
                <div className="grid gap-6">
                  <h3 className="text-lg font-extrabold text-brand-text-primary">
                    배경 & 테두리 (Background & Borders)
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    {[
                      {
                        name: "Bg Light",
                        cls: "bg-brand-bg-light border border-brand-border-muted",
                        var: "var(--brand-bg-light)",
                        desc: "콘텐츠 전체 페이지 배경",
                      },
                      {
                        name: "Bg Muted",
                        cls: "bg-brand-bg-muted border border-brand-border-muted",
                        var: "var(--brand-bg-muted)",
                        desc: "서브 영역 / 호버 시 백그라운드 칩",
                      },
                      {
                        name: "Border Muted",
                        cls: "bg-white border border-brand-border-muted",
                        var: "var(--brand-border-muted)",
                        desc: "연한 카드 구분선 / 얇은 라인",
                      },
                      {
                        name: "Border Gray",
                        cls: "bg-white border border-brand-border-gray",
                        var: "var(--brand-border-gray)",
                        desc: "인풋 포커스 아웃 / 보조 테두리",
                      },
                    ].map((col) => (
                      <div
                        key={col.name}
                        className="rounded-2xl border border-brand-border-muted bg-white p-4 shadow-sm"
                      >
                        <div
                          className={`h-20 w-full rounded-xl mb-3 ${col.cls}`}
                        />
                        <p className="text-sm font-extrabold text-brand-text-primary">
                          {col.name}
                        </p>
                        <p className="text-xs font-mono text-brand-text-muted mt-1 select-all">
                          {col.var}
                        </p>
                        <p className="text-[11px] text-brand-text-light mt-1.5 leading-normal font-semibold">
                          {col.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Text Hierarchy */}
                <div className="grid gap-6">
                  <h3 className="text-lg font-extrabold text-brand-text-primary">
                    텍스트 위계 (Text Colors)
                  </h3>
                  <div className="rounded-2xl border border-brand-border-muted bg-white p-6 shadow-sm grid gap-5">
                    {[
                      {
                        name: "brand-text-primary",
                        var: "var(--brand-text-primary)",
                        colorClass: "text-brand-text-primary",
                        desc: "주 타이틀, 헤드라인, 핵심 텍스트 및 기본 피드백",
                        example: "대강당 및 3층 회의실 일정 잡기 완료",
                      },
                      {
                        name: "brand-text-secondary",
                        var: "var(--brand-text-secondary)",
                        colorClass: "text-brand-text-secondary",
                        desc: "본문 바디 영역, 일반 묘사 텍스트 및 안내 레이블",
                        example:
                          "모임 멤버가 등록한 스케줄이 실시간으로 동기화됩니다.",
                      },
                      {
                        name: "brand-text-muted",
                        var: "var(--brand-text-muted)",
                        colorClass: "text-brand-text-muted",
                        desc: "기타 부가 메타 정보, 생성 시간, 연동 상태 텍스트",
                        example: "2026년 6월 8일 생성됨 · 수정 1분 전",
                      },
                      {
                        name: "brand-text-light",
                        var: "var(--brand-text-light)",
                        colorClass: "text-brand-text-light",
                        desc: "비활성화 상태의 아이콘이나 플레이스홀더 성격의 텍스트",
                        example: "새로운 모임 생성 대기 중...",
                      },
                    ].map((tx) => (
                      <div
                        key={tx.name}
                        className="grid gap-2 border-b border-brand-border-muted pb-4 last:border-0 last:pb-0 sm:grid-cols-[200px_1fr]"
                      >
                        <div>
                          <p
                            className={`text-base font-extrabold ${tx.colorClass}`}
                          >
                            {tx.name}
                          </p>
                          <p className="text-xs font-mono text-brand-text-light mt-0.5">
                            {tx.var}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-brand-text-secondary mb-1">
                            {tx.desc}
                          </p>
                          <p className={`text-sm ${tx.colorClass}`}>
                            예시: &quot;{tx.example}&quot;
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* TAB: BUTTONS */}
            {activeTab === "buttons" && (
              <section className="grid gap-8">
                {/* Brand Purple Button */}
                <div className="rounded-2xl border border-brand-border-muted bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-brand-border-muted pb-4 mb-6">
                    <div>
                      <h3 className="text-xl font-extrabold text-brand-text-primary">
                        PurpleButton / Button (Brand Variants)
                      </h3>
                      <p className="text-xs font-semibold text-brand-text-muted mt-1">
                        본문의 행동 중요도에 따라 구분해 사용하는 브랜드 버튼
                        컬렉션
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `import { PurpleButton } from "@/components/moim/reference-ui";\n\n// 1. Refined Tinted (Default)\n<PurpleButton variant="tintBrand">시작하기</PurpleButton>\n\n// 2. Solid Brand (Primary)\n<PurpleButton variant="solidBrand">완료하기</PurpleButton>\n\n// 3. Ghost Brand (Low Profile)\n<PurpleButton variant="ghostBrand">취소</PurpleButton>`,
                          "code-purple-btn",
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border-gray px-3 py-1.5 text-xs font-bold text-brand-text-secondary hover:bg-brand-bg-muted"
                    >
                      {copiedText === "code-purple-btn" ? (
                        <Check className="h-3.5 w-3.5 text-brand-purple" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      복사
                    </button>
                  </div>

                  <div className="grid gap-6">
                    <div className="grid gap-4 sm:grid-cols-3 bg-brand-bg-light p-6 rounded-2xl border border-brand-border-muted">
                      {/* Tint Brand Card */}
                      <div className="flex flex-col gap-3 items-center justify-between p-4 bg-white rounded-xl border border-brand-border-muted text-center">
                        <span className="text-[10px] font-bold text-brand-purple uppercase bg-brand-purple/10 px-2 py-0.5 rounded">
                          1. Tint Brand (Default)
                        </span>
                        <PurpleButton variant="tintBrand" className="w-full">
                          가능 시간 제출
                        </PurpleButton>
                        <span className="text-[10px] font-semibold text-brand-text-muted">
                          본문 표준 버튼 (클릭유도성 우수)
                        </span>
                      </div>

                      {/* Solid Brand Card */}
                      <div className="flex flex-col gap-3 items-center justify-between p-4 bg-white rounded-xl border border-brand-border-muted text-center">
                        <span className="text-[10px] font-bold text-brand-purple uppercase bg-brand-purple/10 px-2 py-0.5 rounded">
                          2. Solid Brand (Primary)
                        </span>
                        <PurpleButton variant="solidBrand" className="w-full">
                          초대 링크 만들기
                        </PurpleButton>
                        <span className="text-[10px] font-semibold text-brand-text-muted">
                          페이지 최우선 주작업 버튼
                        </span>
                      </div>

                      {/* Ghost Brand Card */}
                      <div className="flex flex-col gap-3 items-center justify-between p-4 bg-white rounded-xl border border-brand-border-muted text-center">
                        <span className="text-[10px] font-bold text-gray-500 uppercase bg-gray-100 px-2 py-0.5 rounded">
                          3. Ghost Brand (Subtle)
                        </span>
                        <PurpleButton variant="ghostBrand" className="w-full">
                          캘린더 연동 관리
                        </PurpleButton>
                        <span className="text-[10px] font-semibold text-brand-text-muted">
                          내비바 / 부차적인 취소 버튼
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Controls */}
                <div className="rounded-2xl border border-brand-border-muted bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-brand-border-muted pb-4 mb-6">
                    <div>
                      <h3 className="text-xl font-extrabold text-brand-text-primary">
                        폼 인풋 & 셀렉트 컨트롤
                      </h3>
                      <p className="text-xs font-semibold text-brand-text-muted mt-1">
                        전역 스타일 `.moim-input` 과 `.moim-select` 매핑
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `<input className="moim-input" placeholder="플레이스홀더" />\n\n<select className="moim-select">\n  <option>옵션</option>\n</select>`,
                          "code-forms",
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border-gray px-3 py-1.5 text-xs font-bold text-brand-text-secondary hover:bg-brand-bg-muted"
                    >
                      {copiedText === "code-forms" ? (
                        <Check className="h-3.5 w-3.5 text-brand-purple" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      복사
                    </button>
                  </div>

                  <div className="grid gap-5 max-w-lg">
                    <div className="grid gap-1.5">
                      <label className="text-sm font-bold text-brand-text-primary">
                        텍스트 입력 폼
                      </label>
                      <input
                        type="text"
                        value={testInput}
                        onChange={(e) => setTestInput(e.target.value)}
                        placeholder="이메일을 입력하세요..."
                        className="moim-input"
                      />
                    </div>

                    <div className="grid gap-1.5">
                      <label className="text-sm font-bold text-brand-text-primary">
                        선택 박스 (Select Box)
                      </label>
                      <select
                        value={testSelect}
                        onChange={(e) => setTestSelect(e.target.value)}
                        className="moim-select"
                      >
                        <option value="option1">모임 인원 제한 없음</option>
                        <option value="option2">최대 10명</option>
                        <option value="option3">최대 30명</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Social Login Buttons */}
                <div className="rounded-2xl border border-brand-border-muted bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-brand-border-muted pb-4 mb-6">
                    <div>
                      <h3 className="text-xl font-extrabold text-brand-text-primary">
                        소셜 로그인 연동 버튼 (Social Brands)
                      </h3>
                      <p className="text-xs font-semibold text-brand-text-muted mt-1">
                        공식 브랜드 색상을 보존하여 구현된 소셜 간편 로그인
                        컴포넌트
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `<a href="/auth/kakao" className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-[#fee500] text-lg font-bold text-[#191919]">\n  <AuthProviderGlyph type="kakao" /> 카카오로 시작하기\n</a>`,
                          "code-socials",
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border-gray px-3 py-1.5 text-xs font-bold text-brand-text-secondary hover:bg-brand-bg-muted"
                    >
                      {copiedText === "code-socials" ? (
                        <Check className="h-3.5 w-3.5 text-brand-purple" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      복사
                    </button>
                  </div>

                  <div className="grid gap-4 max-w-md">
                    <button className="relative inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-[#fee500] text-lg font-bold text-[#191919] hover:opacity-90 active:scale-95 transition-all">
                      <AuthProviderGlyph type="kakao" className="h-5 w-5" />
                      카카오로 시작하기
                    </button>

                    <button className="relative inline-flex h-14 items-center justify-center gap-3 rounded-xl border border-brand-border-gray bg-white text-lg font-bold text-brand-text-primary hover:bg-brand-bg-light active:scale-95 transition-all">
                      <AuthProviderGlyph type="google" className="h-5 w-5" />
                      Google로 시작하기
                    </button>

                    <button className="relative inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-[#03c75a] text-lg font-bold text-white hover:opacity-90 active:scale-95 transition-all">
                      <AuthProviderGlyph type="naver" className="h-5 w-5" />
                      네이버로 시작하기
                    </button>

                    <button className="relative inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-[#111] text-lg font-bold text-white hover:opacity-90 active:scale-95 transition-all">
                      <AuthProviderGlyph type="apple" className="h-5 w-5" />
                      Apple로 시작하기
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* TAB: LAYOUT */}
            {activeTab === "layout" && (
              <section className="grid gap-8">
                {/* MoimShell */}
                <div className="rounded-2xl border border-brand-border-muted bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-brand-border-muted pb-4 mb-4">
                    <div>
                      <h3 className="text-xl font-extrabold text-brand-text-primary">
                        MoimShell & MoimTopBar
                      </h3>
                      <p className="text-xs font-semibold text-brand-text-muted mt-1">
                        페이지 전반을 감싸는 전체 레이아웃 쉘 및 상단 바
                        내비게이션
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `<MoimShell>\n  <MoimTopBar activeHref="/" />\n  {children}\n</MoimShell>`,
                          "code-shell",
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border-gray px-3 py-1.5 text-xs font-bold text-brand-text-secondary hover:bg-brand-bg-muted"
                    >
                      {copiedText === "code-shell" ? (
                        <Check className="h-3.5 w-3.5 text-brand-purple" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      복사
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-brand-border-muted bg-brand-bg-light shadow-inner">
                    <MoimTopBar activeHref="/" />
                    <div className="p-8 text-center text-sm font-semibold text-brand-text-muted">
                      본문 프레임워크 쉘 영역
                    </div>
                  </div>
                </div>

                {/* ProgressHeader */}
                <div className="rounded-2xl border border-brand-border-muted bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-brand-border-muted pb-4 mb-6">
                    <div>
                      <h3 className="text-xl font-extrabold text-brand-text-primary">
                        ProgressHeader
                      </h3>
                      <p className="text-xs font-semibold text-brand-text-muted mt-1">
                        다단계 프로세스 일정 생성 등의 화면에서 퍼센트 막대를
                        표시하는 헤더
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `<ProgressHeader label="일정 입력" progress="60%" />`,
                          "code-progress",
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border-gray px-3 py-1.5 text-xs font-bold text-brand-text-secondary hover:bg-brand-bg-muted"
                    >
                      {copiedText === "code-progress" ? (
                        <Check className="h-3.5 w-3.5 text-brand-purple" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      복사
                    </button>
                  </div>

                  <div className="grid gap-6">
                    <div className="bg-brand-bg-light p-6 rounded-2xl border border-brand-border-muted">
                      <ProgressHeader
                        label="모임 기본 정보 설정"
                        progress={progressVal}
                      />

                      {/* Slider Control to test */}
                      <div className="mt-8 max-w-xs mx-auto grid gap-2">
                        <label className="text-xs font-bold text-brand-text-secondary text-center">
                          체험하기 (진행 상황 변경): {progressVal}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={parseInt(progressVal)}
                          onChange={(e) => setProgressVal(`${e.target.value}%`)}
                          className="accent-brand-purple"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* TAB: SCHEDULER */}
            {activeTab === "scheduler" && (
              <section className="grid gap-8">
                {/* HeatmapGrid */}
                <div className="rounded-2xl border border-brand-border-muted bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-brand-border-muted pb-4 mb-6">
                    <div>
                      <h3 className="text-xl font-extrabold text-brand-text-primary">
                        HeatmapGrid
                      </h3>
                      <p className="text-xs font-semibold text-brand-text-muted mt-1">
                        팀원들의 가용 가능한 시간 겹침 빈도를 시각화하는 보라색
                        히트맵 격자
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(`<HeatmapGrid />`, "code-heatmap")
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border-gray px-3 py-1.5 text-xs font-bold text-brand-text-secondary hover:bg-brand-bg-muted"
                    >
                      {copiedText === "code-heatmap" ? (
                        <Check className="h-3.5 w-3.5 text-brand-purple" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      복사
                    </button>
                  </div>

                  <div>
                    <HeatmapGrid />
                  </div>
                </div>

                {/* CalendarInfoCard */}
                <div className="rounded-2xl border border-brand-border-muted bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-brand-border-muted pb-4 mb-6">
                    <div>
                      <h3 className="text-xl font-extrabold text-brand-text-primary">
                        CalendarInfoCard
                      </h3>
                      <p className="text-xs font-semibold text-brand-text-muted mt-1">
                        모임 요약 정보(희망 기간, 예상 소요 시간) 표시 컴포넌트
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(`<CalendarInfoCard />`, "code-infocard")
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border-gray px-3 py-1.5 text-xs font-bold text-brand-text-secondary hover:bg-brand-bg-muted"
                    >
                      {copiedText === "code-infocard" ? (
                        <Check className="h-3.5 w-3.5 text-brand-purple" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      복사
                    </button>
                  </div>

                  <div>
                    <CalendarInfoCard />
                  </div>
                </div>

                {/* ProviderGlyph */}
                <div className="rounded-2xl border border-brand-border-muted bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-brand-border-muted pb-4 mb-6">
                    <div>
                      <h3 className="text-xl font-extrabold text-brand-text-primary">
                        ProviderGlyph / EmptyAvatar
                      </h3>
                      <p className="text-xs font-semibold text-brand-text-muted mt-1">
                        간편 연동에 사용되는 서비스 로고 글리프 및 아바타 자리
                        표시자
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `<ProviderGlyph type="google" />\n<EmptyAvatar>U</EmptyAvatar>`,
                          "code-glyphs",
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border-gray px-3 py-1.5 text-xs font-bold text-brand-text-secondary hover:bg-brand-bg-muted"
                    >
                      {copiedText === "code-glyphs" ? (
                        <Check className="h-3.5 w-3.5 text-brand-purple" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      복사
                    </button>
                  </div>

                  <div className="flex flex-col gap-6">
                    <div>
                      <p className="text-sm font-bold text-brand-text-primary mb-3">
                        ProviderGlyphs
                      </p>
                      <div className="flex flex-wrap gap-4 items-center">
                        {(
                          [
                            "google",
                            "apple",
                            "everytime",
                            "ics",
                            "kakao",
                            "naver",
                          ] as const
                        ).map((type) => (
                          <div
                            key={type}
                            className="flex flex-col items-center gap-1"
                          >
                            <ProviderGlyph type={type} />
                            <span className="text-xs font-mono text-brand-text-muted">
                              {type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-brand-text-primary mb-3">
                        EmptyAvatar
                      </p>
                      <div className="flex gap-3">
                        <EmptyAvatar>김</EmptyAvatar>
                        <EmptyAvatar>이</EmptyAvatar>
                        <EmptyAvatar>박</EmptyAvatar>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CalendarBoard */}
                <div className="rounded-2xl border border-brand-border-muted bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-brand-border-muted pb-4 mb-6">
                    <div>
                      <h3 className="text-xl font-extrabold text-brand-text-primary">
                        CalendarBoard
                      </h3>
                      <p className="text-xs font-semibold text-brand-text-muted mt-1">
                        하루의 특정 시간대별 일정을 격자 위에 렌더링하는 주간
                        시간표 보드
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(`<CalendarBoard />`, "code-calboard")
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border-gray px-3 py-1.5 text-xs font-bold text-brand-text-secondary hover:bg-brand-bg-muted"
                    >
                      {copiedText === "code-calboard" ? (
                        <Check className="h-3.5 w-3.5 text-brand-purple" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      복사
                    </button>
                  </div>

                  <div>
                    <CalendarBoard />
                  </div>
                </div>

                {/* SchedulerPreview */}
                <div className="rounded-2xl border border-brand-border-muted bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-brand-border-muted pb-4 mb-6">
                    <div>
                      <h3 className="text-xl font-extrabold text-brand-text-primary">
                        SchedulerPreview
                      </h3>
                      <p className="text-xs font-semibold text-brand-text-muted mt-1">
                        시간표 보드와 사이드 일정을 결합한 대형 메인 스케줄러
                        미리보기 블록
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `<SchedulerPreview compact />`,
                          "code-schedpreview",
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border-gray px-3 py-1.5 text-xs font-bold text-brand-text-secondary hover:bg-brand-bg-muted"
                    >
                      {copiedText === "code-schedpreview" ? (
                        <Check className="h-3.5 w-3.5 text-brand-purple" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      복사
                    </button>
                  </div>

                  <div>
                    <SchedulerPreview compact />
                  </div>
                </div>
              </section>
            )}

            {/* TAB: MODALS */}
            {activeTab === "modals" && (
              <section className="grid gap-8">
                {/* TermsModal */}
                <div className="rounded-2xl border border-brand-border-muted bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-brand-border-muted pb-4 mb-6">
                    <div>
                      <h3 className="text-xl font-extrabold text-brand-text-primary">
                        TermsModal (약관 확인 모달)
                      </h3>
                      <p className="text-xs font-semibold text-brand-text-muted mt-1">
                        회원가입 동의 체크 항목별 세부 약관 및 규정을 띄우는
                        모달 컴포넌트
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `import { TermsModal } from "@/components/moim/TermsModal";\n\n{isOpen && <TermsModal termsKey="privacyAgreed" onClose={closeModal} />}`,
                          "code-termsmodal",
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border-gray px-3 py-1.5 text-xs font-bold text-brand-text-secondary hover:bg-brand-bg-muted"
                    >
                      {copiedText === "code-termsmodal" ? (
                        <Check className="h-3.5 w-3.5 text-brand-purple" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      복사
                    </button>
                  </div>

                  <div className="grid gap-4 bg-brand-bg-light p-6 rounded-2xl border border-brand-border-muted">
                    <p className="text-sm font-bold text-brand-text-primary">
                      모달 유형 선택 후 테스트 해보세요:
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { key: "isAgeOver14", label: "만 14세 이상 이용 약관" },
                        { key: "termsAgreed", label: "서비스 이용약관" },
                        { key: "privacyAgreed", label: "개인정보 수집 동의" },
                        { key: "marketingAgreed", label: "마케팅 활용 동의" },
                        { key: "eventSmsAgreed", label: "이벤트 수신 동의" },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setTermsModalKey(item.key as TermsKey)}
                          className="rounded-xl border border-brand-border-gray bg-white px-4 py-2.5 text-sm font-bold text-brand-text-secondary hover:border-brand-purple hover:text-brand-purple transition-all"
                        >
                          {item.label} 띄우기
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      {/* Render the selected terms modal */}
      {termsModalKey && (
        <TermsModal
          termsKey={termsModalKey}
          onClose={() => setTermsModalKey(null)}
        />
      )}
    </MoimShell>
  );
}
