import Link from "next/link";
import { CalendarDays, CheckCircle2, Sparkles } from "lucide-react";
import {
  HeatmapGrid,
  MoimShell,
  MoimTopBar,
  SchedulerPreview,
} from "@/components/moim/reference-ui";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export default function Home() {
  return (
    <MoimShell className="bg-gradient-to-b from-white via-white to-brand-bg-muted overflow-x-hidden">
      <MoimTopBar />

      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-16 pt-20 text-center">
        <ScrollReveal duration={500}>
          <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-brand-border-muted bg-gradient-to-r from-brand-purple-ring to-brand-bg-muted px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-brand-purple shadow-sm glow-pulse whitespace-nowrap">
            <Sparkles className="h-3.5 w-3.5" />
            AI 기반 약속 잡기 비서
          </div>
        </ScrollReveal>

        <ScrollReveal duration={600} delay={100}>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-tight tracking-normal text-brand-text-primary sm:text-6xl">
            1초 만에{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-purple-light">
              약속 잡기
            </span>
          </h1>
        </ScrollReveal>

        <ScrollReveal duration={600} delay={200}>
          <p className="mt-7 max-w-3xl text-xl font-medium leading-9 text-brand-text-secondary">
            모두의 일정을 분석하여 최적의 시간을 추천해 드립니다.
            <br />
            복잡한 스케줄 조정, 이제{" "}
            <strong className="text-brand-purple">MOIM</strong>에게 맡기세요.
          </p>
        </ScrollReveal>

        <ScrollReveal duration={750} delay={350} className="w-full">
          <div className="mt-16 w-full transform transition-all duration-500 hover:scale-[1.01]">
            <SchedulerPreview />
          </div>
        </ScrollReveal>
      </section>

      <section className="mx-auto grid max-w-6xl gap-16 px-6 py-20 lg:grid-cols-2 lg:items-center">
        <ScrollReveal direction="left" duration={700} className="w-full">
          <div className="lg:max-w-md">
            <h2 className="text-5xl font-extrabold leading-tight tracking-normal bg-clip-text text-transparent bg-gradient-to-br from-brand-text-primary to-brand-text-secondary">
              모든 캘린더 동기화
            </h2>
            <p className="mt-7 text-2xl font-medium leading-10 text-brand-text-secondary">
              구글, 애플, 에브리타임까지.
              <br />
              흩어져 있는 모든 일정을 하나로 모아
              <br />
              실시간으로 동기화합니다.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="right" duration={800} className="w-full">
          <div className="rounded-[2rem] border border-brand-border-muted bg-white p-6 shadow-premium hover:shadow-premium-lg transition-all duration-300 hover:-translate-y-1">
            {[
              ["Google 캘린더", "user@gmail.com 연동됨", "연동 해제"],
              ["Apple 캘린더", "연동되지 않음", "연동하기"],
              ["학생 캘린더", "연동되지 않음", "연동하기"],
              ["에브리타임", "시간표 캡처 이미지 업로드", "캡처 업로드"],
              [".ics 파일 업로드", "기타 캘린더 직접 파일 업로드", "파일 선택"],
            ].map(([title, meta, action]) => (
              <div
                key={title}
                className="flex items-center justify-between border-b border-brand-border-muted py-6 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-bg-muted text-brand-purple shadow-sm border border-brand-border-muted">
                    <CalendarDays className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="font-extrabold text-brand-text-primary">
                      {title}
                    </p>
                    <p className="text-sm font-medium text-brand-text-muted">
                      {meta}
                    </p>
                  </div>
                </div>
                <Link
                  href="/calendar/connect"
                  className="inline-block rounded-xl text-sm font-bold text-brand-purple hover:text-brand-purple-hover hover:scale-105 active:scale-95 transition-all duration-200 px-5 py-2.5 no-underline"
                >
                  {action}
                </Link>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      <section className="mx-auto grid max-w-6xl gap-16 px-6 py-20 lg:grid-cols-2 lg:items-center">
        <ScrollReveal direction="left" duration={800} className="w-full">
          <div className="rounded-[2rem] border border-brand-border-muted bg-white p-8 shadow-premium-lg hover:shadow-premium-lg transition-all duration-300">
            <div className="mb-6 flex items-center gap-2 text-lg font-extrabold text-brand-purple">
              <CheckCircle2 className="h-6 w-6" />
              설정 조건 현황
            </div>
            <HeatmapGrid />
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {["금요일 오후 7:00", "토요일 오후 6:00", "목요일 오후 7:30"].map(
                (slot, index) => (
                  <div
                    key={slot}
                    className="rounded-2xl border border-brand-border-muted bg-brand-bg-light p-4 shadow-sm hover:border-brand-purple-light transition-colors"
                  >
                    <span className="rounded-full bg-brand-bg-muted px-3 py-1.5 text-xs font-bold text-brand-purple">
                      {index + 1}순위
                    </span>
                    <p className="mt-4 text-base font-extrabold text-brand-text-primary">
                      {slot}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="right" duration={700} className="w-full">
          <div className="lg:ml-auto lg:max-w-md">
            <h2 className="text-5xl font-extrabold leading-tight tracking-normal bg-clip-text text-transparent bg-gradient-to-br from-brand-text-primary to-brand-text-secondary">
              AI 추천 시스템
            </h2>
            <p className="mt-7 text-2xl font-medium leading-10 text-brand-text-secondary">
              더 이상 &quot;언제 시간 돼?&quot;라고 물어볼 필요 없이 AI가 모임
              멤버들의 빈 시간을 자동으로 분석하여 최적의 시간과 장소를
              찾아냅니다.
            </p>
          </div>
        </ScrollReveal>
      </section>

      <ScrollReveal direction="up" duration={800} className="mx-6 my-16">
        <section className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-purple-light to-brand-purple px-6 py-16 text-center text-white shadow-premium-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            지금 바로 시작하세요
          </h2>
          <p className="mt-4 text-base font-semibold leading-relaxed text-brand-purple-ring">
            첫 모임 개설까지 단 1분.
            <br />
            MOIM과 함께 스트레스 없는 약속 잡기를 경험해보세요.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex h-12 w-40 items-center justify-center rounded-xl bg-white text-base font-extrabold text-brand-purple transition-all duration-200 hover:scale-105 hover:bg-brand-purple-ring active:scale-95 shadow-md no-underline"
            >
              가입하기
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 w-40 items-center justify-center rounded-xl border border-white/30 bg-transparent text-base font-bold text-white transition-all duration-200 hover:scale-105 hover:bg-white/10 active:scale-95 no-underline"
            >
              로그인하기
            </Link>
          </div>
        </section>
      </ScrollReveal>
    </MoimShell>
  );
}
