"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  LogIn,
  PlusCircle,
  Settings,
  Shield,
  UserPlus,
  Users,
} from "lucide-react";
import { MoimShell, MoimTopBar } from "@/components/moim/reference-ui";

export default function DevHubPage() {
  const router = useRouter();
  const [scheduleId, setScheduleId] = useState("");
  const [hostToken, setHostToken] = useState("");

  const handleJoinParticipant = () => {
    if (!scheduleId.trim()) return alert("모임 ID를 입력해주세요.");
    router.push(`/schedule/${scheduleId.trim()}`);
  };

  const handleJoinHost = () => {
    if (!scheduleId.trim()) return alert("모임 ID를 입력해주세요.");
    const query = hostToken.trim()
      ? `?hostToken=${encodeURIComponent(hostToken.trim())}`
      : "";
    router.push(`/schedule/${scheduleId.trim()}${query}`);
  };

  return (
    <MoimShell className="bg-gradient-to-b from-brand-bg-light to-brand-bg-muted min-h-screen">
      <MoimTopBar closeHref="/" />

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-purple-ring border border-brand-border-muted px-4 py-1.5 text-xs font-bold text-brand-purple mb-4">
            🔧 개발 & 테스트 허브 (Dev Hub)
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-text-primary tracking-tight">
            MOIM 역할별 화면 테스트 허브
          </h1>
          <p className="mt-3 text-base font-medium text-brand-text-secondary">
            시안{" "}
            <code className="text-brand-purple bg-brand-purple-ring px-1.5 py-0.5 rounded font-mono">
              01_guest_role_hub
            </code>
            를 포팅한 개발용 페이지입니다. 각 역할과 화면 상태를 즉시 테스트해볼
            수 있습니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column: Flow Routes */}
          <div className="grid gap-6">
            {/* 게스트 & 모임 생성 카드 */}
            <div className="rounded-[1.5rem] border border-brand-border-muted bg-white p-6 shadow-premium hover:shadow-premium-lg transition-all duration-300">
              <h2 className="text-lg font-extrabold text-brand-text-primary flex items-center gap-2 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600">
                  <PlusCircle className="h-5 w-5" />
                </span>
                게스트 & 모임 생성 흐름
              </h2>
              <div className="grid gap-3">
                <Link
                  href="/"
                  className="flex items-center justify-between rounded-xl border border-brand-border-gray p-4 hover:border-brand-purple-accent hover:bg-brand-bg-light transition-all no-underline"
                >
                  <div>
                    <p className="font-bold text-brand-text-primary text-sm">
                      게스트 소개 홈 (/)
                    </p>
                    <p className="text-xs text-brand-text-muted mt-1">
                      시안 02_guest_value_landing
                    </p>
                  </div>
                  <span className="text-brand-purple font-bold text-sm">
                    진입 →
                  </span>
                </Link>
                <Link
                  href="/schedule/create"
                  className="flex items-center justify-between rounded-xl border border-brand-border-gray p-4 hover:border-brand-purple-accent hover:bg-brand-bg-light transition-all no-underline"
                >
                  <div>
                    <p className="font-bold text-brand-text-primary text-sm">
                      모임 만들기 (/schedule/create)
                    </p>
                    <p className="text-xs text-brand-text-muted mt-1">
                      시안 11~13_host_create_meeting
                    </p>
                  </div>
                  <span className="text-brand-purple font-bold text-sm">
                    진입 →
                  </span>
                </Link>
              </div>
            </div>

            {/* 로그인 & 가입 및 대시보드 카드 */}
            <div className="rounded-[1.5rem] border border-brand-border-muted bg-white p-6 shadow-premium hover:shadow-premium-lg transition-all duration-300">
              <h2 className="text-lg font-extrabold text-brand-text-primary flex items-center gap-2 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-purple-ring text-brand-purple">
                  <LayoutDashboard className="h-5 w-5" />
                </span>
                가입 및 대시보드 흐름
              </h2>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    className="flex flex-col items-center justify-center rounded-xl border border-brand-border-gray p-4 hover:border-brand-purple-accent hover:bg-brand-bg-light transition-all text-center no-underline"
                  >
                    <LogIn className="h-5 w-5 text-brand-purple mb-2" />
                    <span className="font-bold text-brand-text-primary text-xs">
                      로그인 (/login)
                    </span>
                  </Link>
                  <Link
                    href="/signup"
                    className="flex flex-col items-center justify-center rounded-xl border border-brand-border-gray p-4 hover:border-brand-purple-accent hover:bg-brand-bg-light transition-all text-center no-underline"
                  >
                    <UserPlus className="h-5 w-5 text-brand-purple mb-2" />
                    <span className="font-bold text-brand-text-primary text-xs">
                      회원가입 (/signup)
                    </span>
                  </Link>
                </div>
                <Link
                  href="/dashboard"
                  className="flex items-center justify-between rounded-xl border border-brand-border-gray p-4 hover:border-brand-purple-accent hover:bg-brand-bg-light transition-all no-underline"
                >
                  <div>
                    <p className="font-bold text-brand-text-primary text-sm">
                      가입자 대시보드 (/dashboard)
                    </p>
                    <p className="text-xs text-brand-text-muted mt-1">
                      시안 06~10_signed_in_home 및 설정
                    </p>
                  </div>
                  <span className="text-brand-purple font-bold text-sm">
                    진입 →
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Room Tester */}
          <div className="grid gap-6">
            <div className="rounded-[1.5rem] border border-brand-border-muted bg-white p-6 shadow-premium hover:shadow-premium-lg transition-all duration-300">
              <h2 className="text-lg font-extrabold text-brand-text-primary flex items-center gap-2 mb-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <CalendarDays className="h-5 w-5" />
                </span>
                특정 모임 방(Room) 바로 진입
              </h2>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="dev-schedule-id"
                    className="block text-xs font-bold text-brand-text-secondary mb-1.5"
                  >
                    모임 ID (Schedule UUID)
                  </label>
                  <input
                    id="dev-schedule-id"
                    type="text"
                    value={scheduleId}
                    onChange={(e) => setScheduleId(e.target.value)}
                    placeholder="예: 7c9e66ab-8356..."
                    className="moim-input text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="dev-host-token"
                    className="block text-xs font-bold text-brand-text-secondary mb-1.5"
                  >
                    호스트 권한 토큰 (Host Token - 결과 조회/확정용)
                  </label>
                  <input
                    id="dev-host-token"
                    type="text"
                    value={hostToken}
                    onChange={(e) => setHostToken(e.target.value)}
                    placeholder="선택 사항"
                    className="moim-input text-sm"
                  />
                </div>

                <div className="pt-2 grid grid-cols-2 gap-3">
                  <button
                    onClick={handleJoinParticipant}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-brand-border-gray bg-white text-sm font-bold text-brand-text-primary hover:bg-brand-bg-light transition-all"
                  >
                    <Users className="h-4 w-4 text-brand-purple" />
                    참여자 화면 진입
                  </button>
                  <button
                    onClick={handleJoinHost}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-purple text-sm font-bold text-white hover:bg-brand-purple-hover transition-all"
                  >
                    <Shield className="h-4 w-4 text-white" />
                    호스트 화면 진입
                  </button>
                </div>
              </div>
            </div>

            {/* 시안 목록 매핑 카드 */}
            <div className="rounded-[1.5rem] border border-brand-border-muted bg-white p-6 shadow-premium">
              <h3 className="text-xs font-extrabold text-brand-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Settings className="h-3.5 w-3.5" />
                시안 목록 및 연동 체크리스트
              </h3>
              <ul className="text-xs text-brand-text-secondary space-y-2 max-h-[140px] overflow-y-auto scroller-style pr-1">
                <li className="flex items-center justify-between">
                  <span>01_guest_role_hub</span>{" "}
                  <span className="text-brand-purple font-bold">
                    완료 (Dev Hub)
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span>02~03_guest_value_landing</span>{" "}
                  <span>연동됨 (홈)</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>04_guest_save_later_prompt</span> <span>진행 예정</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>06_signed_in_home (대시보드)</span>{" "}
                  <span className="text-brand-text-light">대기</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>11~13_host_create_meeting</span>{" "}
                  <span>연동됨 (생성)</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>15_host_status_board (결과)</span>{" "}
                  <span>연동됨 (상태방)</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>16~20_participant_time_grid</span>{" "}
                  <span>연동됨 (참여방)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </MoimShell>
  );
}
