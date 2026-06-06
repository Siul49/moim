import Link from "next/link";
import { CalendarDays, CheckCircle2, Sparkles } from "lucide-react";
import {
  HeatmapGrid,
  MoimShell,
  MoimTopBar,
  SchedulerPreview,
} from "@/components/moim/reference-ui";

export default function Home() {
  return (
    <MoimShell className="bg-gradient-to-b from-white via-white to-[#eeeafa]">
      <MoimTopBar />

      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-16 pt-20 text-center">
        <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-[#ded4f7] bg-gradient-to-r from-[#e9ddff] to-[#f5efff] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#6252ac] shadow-sm glow-pulse whitespace-nowrap">
          <Sparkles className="h-3.5 w-3.5" />
          AI 기반 약속 잡기 비서
        </div>
        <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-normal text-[#252329] sm:text-6xl">
          1초 만에{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6252ac] to-[#8f7bd6]">
            약속 잡기
          </span>
        </h1>
        <p className="mt-7 max-w-3xl text-xl font-medium leading-9 text-[#5f5865]">
          모두의 일정을 분석하여 최적의 시간을 추천해 드립니다.
          <br />
          복잡한 스케줄 조정, 이제{" "}
          <strong className="text-[#6252ac]">MOIM</strong>에게 맡기세요.
        </p>

        <div className="mt-16 w-full transform transition-all duration-500 hover:scale-[1.01]">
          <SchedulerPreview />
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-16 px-6 py-20 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-5xl font-extrabold leading-tight tracking-normal bg-clip-text text-transparent bg-gradient-to-br from-[#252329] to-[#5f5865]">
            모든 캘린더 동기화
          </h2>
          <p className="mt-7 text-2xl font-medium leading-10 text-[#5f5865]">
            구글, 애플, 에브리타임까지.
            <br />
            흩어져 있는 모든 일정을 하나로 모아
            <br />
            실시간으로 동기화합니다.
          </p>
        </div>
        <div className="rounded-[2rem] border border-[#eeeaf5] bg-white p-6 shadow-premium hover:shadow-premium-lg transition-all duration-300 hover:-translate-y-1">
          {[
            ["Google 캘린더", "user@gmail.com 연동됨", "연동 해제"],
            ["Apple 캘린더", "연동되지 않음", "연동하기"],
            ["학생 캘린더", "연동되지 않음", "연동하기"],
            ["에브리타임", "시간표 캡처 이미지 업로드", "캡처 업로드"],
            [".ics 파일 업로드", "기타 캘린더 직접 파일 업로드", "파일 선택"],
          ].map(([title, meta, action]) => (
            <div
              key={title}
              className="flex items-center justify-between border-b border-[#eee8f4] py-4.5 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#f8f5fe] text-[#6252ac] shadow-sm border border-[#f0e8fc]">
                  <CalendarDays className="h-5.5 w-5.5" />
                </span>
                <div>
                  <p className="font-extrabold text-[#252329]">{title}</p>
                  <p className="text-sm font-medium text-[#77727c]">{meta}</p>
                </div>
              </div>
              <Link
                href="/calendar/connect"
                className="rounded-xl bg-[#8f7bd6] px-4.5 py-2.5 text-sm font-bold text-white hover:bg-[#7d68c9] transition-all duration-155 hover:scale-[1.03] active:scale-95 shadow-sm"
              >
                {action}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-16 px-6 py-20 lg:grid-cols-2 lg:items-center">
        <div className="rounded-[2rem] border border-[#eee8f4] bg-white p-8 shadow-premium-lg hover:shadow-premium-lg transition-all duration-300">
          <div className="mb-6 flex items-center gap-2 text-lg font-extrabold text-[#6252ac]">
            <CheckCircle2 className="h-5.5 w-5.5" />
            설정 조건 현황
          </div>
          <HeatmapGrid />
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {["금요일 오후 7:00", "토요일 오후 6:00", "목요일 오후 7:30"].map(
              (slot, index) => (
                <div
                  key={slot}
                  className="rounded-2xl border border-[#eeeaf6] bg-[#fdfcff] p-4 shadow-sm hover:border-[#8f7bd6] transition-colors"
                >
                  <span className="rounded-full bg-[#f3eefd] px-3 py-1.5 text-xs font-bold text-[#6252ac]">
                    {index + 1}순위
                  </span>
                  <p className="mt-4 text-base font-extrabold text-[#252329]">
                    {slot}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
        <div>
          <h2 className="text-5xl font-extrabold leading-tight tracking-normal bg-clip-text text-transparent bg-gradient-to-br from-[#252329] to-[#5f5865]">
            AI 추천 시스템
          </h2>
          <p className="mt-7 text-2xl font-medium leading-10 text-[#5f5865]">
            더 이상 &quot;언제 시간 돼?&quot;라고 물어볼 필요 없이 AI가 모임
            멤버들의 빈 시간을 자동으로 분석하여 최적의 시간과 장소를
            찾아냅니다.
          </p>
        </div>
      </section>

      <section className="relative overflow-hidden mx-6 my-20 rounded-[2.5rem] bg-gradient-to-br from-[#8f7bd6] to-[#6252ac] px-6 py-24 text-center text-white shadow-premium-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
        <h2 className="text-5xl font-extrabold tracking-tight text-white">
          지금 바로 시작하세요
        </h2>
        <p className="mt-6 text-lg font-semibold leading-8 text-[#e9e3ff]">
          첫 모임 개설까지 단 1분.
          <br />
          MOIM과 함께 스트레스 없는 약속 잡기를 경험해보세요.
        </p>
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex h-12 w-44 items-center justify-center rounded-xl bg-white text-base font-bold text-[#6252ac] shadow-lg hover:bg-[#f6f3ff] transition-all duration-200 hover:scale-105 active:scale-95"
          >
            가입하기
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 w-44 items-center justify-center rounded-xl border border-white/30 bg-white/10 backdrop-blur-sm text-base font-bold text-white transition-all duration-200 hover:bg-white/20 hover:scale-105 active:scale-95 shadow-lg"
          >
            로그인 하기
          </Link>
          <Link
            href="/schedule/create"
            className="inline-flex h-12 w-44 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-sm font-semibold text-white/95 transition-all duration-200 hover:bg-white/15 hover:scale-105 active:scale-95"
          >
            문의하기
          </Link>
        </div>
      </section>
    </MoimShell>
  );
}
