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
        <div className="mb-7 inline-flex items-center gap-2 rounded-full bg-[#e9ddff] px-4 py-2 text-sm font-bold text-[#6252ac]">
          <Sparkles className="h-4 w-4" />
          AI 기반 약속 잡기 비서
        </div>
        <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-normal text-[#252329] sm:text-6xl">
          1초 만에 <span className="text-[#6252ac]">약속 잡기</span>
        </h1>
        <p className="mt-7 max-w-3xl text-xl font-medium leading-9 text-[#5f5865]">
          모두의 일정을 분석하여 최적의 시간을 추천해 드립니다.
          <br />
          복잡한 스케줄 조정, 이제 <strong>MOIM</strong>에게 맡기세요.
        </p>

        <div className="mt-16 w-full">
          <SchedulerPreview />
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-16 px-6 py-20 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-5xl font-extrabold leading-tight tracking-normal">
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
        <div className="rounded-[2rem] border border-[#eee8f4] bg-[#fbf7ff] p-6 shadow-sm">
          {[
            ["Google 캘린더", "user@gmail.com 연동됨", "연동 해제"],
            ["Apple 캘린더", "연동되지 않음", "연동하기"],
            ["학생 캘린더", "연동되지 않음", "연동하기"],
            ["에브리타임", "시간표 캡처 이미지 업로드", "캡처 업로드"],
            [".ics 파일 업로드", "기타 캘린더 직접 파일 업로드", "파일 선택"],
          ].map(([title, meta, action]) => (
            <div
              key={title}
              className="flex items-center justify-between border-b border-[#eee8f4] py-4 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#6252ac] shadow-sm">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-bold">{title}</p>
                  <p className="text-sm text-[#77727c]">{meta}</p>
                </div>
              </div>
              <span className="rounded-lg bg-[#8f7bd6] px-4 py-2 text-sm font-bold text-white">
                {action}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-16 px-6 py-20 lg:grid-cols-2 lg:items-center">
        <div className="rounded-[2rem] border border-[#eee8f4] bg-white p-8 shadow-[0_22px_60px_rgba(95,82,130,0.12)]">
          <div className="mb-5 flex items-center gap-2 text-lg font-bold">
            <CheckCircle2 className="h-5 w-5 text-[#6252ac]" />
            설정 조건 현황
          </div>
          <HeatmapGrid />
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {["금요일 오후 7:00", "토요일 오후 6:00", "목요일 오후 7:30"].map(
              (slot, index) => (
                <div
                  key={slot}
                  className="rounded-2xl border border-[#eee8f4] bg-[#fbf7ff] p-4"
                >
                  <span className="rounded-full bg-[#eee8f9] px-3 py-1 text-xs font-bold text-[#6252ac]">
                    {index + 1}순위
                  </span>
                  <p className="mt-4 text-lg font-bold">{slot}</p>
                </div>
              ),
            )}
          </div>
        </div>
        <div>
          <h2 className="text-5xl font-extrabold leading-tight tracking-normal">
            AI 추천 시스템
          </h2>
          <p className="mt-7 text-2xl font-medium leading-10 text-[#5f5865]">
            더 이상 &quot;언제 시간 돼?&quot;라고 물어볼 필요 없이 AI가 모임
            멤버들의 빈 시간을 자동으로 분석하여 최적의 시간과 장소를
            찾아냅니다.
          </p>
        </div>
      </section>

      <section className="px-6 pb-28 pt-12 text-center">
        <h2 className="text-5xl font-extrabold tracking-normal text-[#6252ac]">
          지금 바로 시작하세요
        </h2>
        <p className="mt-5 text-lg font-semibold leading-8 text-[#6f6284]">
          첫 모임 개설까지 단 1분
          <br />
          MOIM과 함께 스트레스 없는 약속 잡기를 경험해보세요.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex h-12 w-44 items-center justify-center rounded-xl bg-[#8f7bd6] px-7 text-base font-semibold text-white shadow-[0_10px_18px_rgba(98,82,172,0.22)] hover:bg-[#7d68c9]"
          >
            가입하기
          </Link>
          <Link
            href="/schedule/create"
            className="inline-flex h-12 w-44 items-center justify-center rounded-xl border border-[#eee8f4] bg-white text-sm font-medium text-[#8f7bd6] transition-colors hover:bg-muted hover:text-foreground"
          >
            문의하기
          </Link>
        </div>
      </section>
    </MoimShell>
  );
}
