import Link from "next/link";
import {
  Calendar,
  CalendarDays,
  CalendarPlus,
  Sparkles,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null; // Layout will redirect
  }

  // Fetch user profile from Supabase profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const nickname =
    profile?.nickname ||
    user.user_metadata?.nickname ||
    user.email?.split("@")[0] ||
    "사용자";

  // Fetch recent active schedules created by this user
  const recentSchedules = await prisma.schedule.findMany({
    where: { creatorId: user.id },
    take: 4,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { participants: true },
      },
    },
  });

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Welcome Hero */}
      <div className="rounded-[2rem] bg-gradient-to-r from-brand-purple to-brand-purple-hover p-6 md:p-8 text-white shadow-premium-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent)] pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-purple-ring">
            <Sparkles className="h-3 w-3" />
            마이 스페이스
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            안녕하세요, {nickname}님! 👋
          </h1>
          <p className="text-xs md:text-sm font-semibold text-brand-purple-ring max-w-xl">
            오늘도 MOIM과 함께 조율 스트레스 없는 일정을 계획해보세요. 아래에서
            연동 상태와 최근 생성한 일정 현황을 확인할 수 있습니다.
          </p>
        </div>
      </div>

      {/* Grid: Actions & Calendar Sync */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Quick Create Card */}
        <div className="rounded-[1.5rem] border border-brand-border-muted bg-white p-6 shadow-premium hover:shadow-premium-lg transition-all duration-300 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-purple-ring text-brand-purple shadow-sm">
              <CalendarPlus className="h-5 w-5" />
            </span>
            <h2 className="text-base font-extrabold text-brand-text-primary">
              빠른 일정 조율 개설
            </h2>
            <p className="text-xs text-brand-text-muted leading-relaxed">
              조별 과제, 스터디, 동아리 모임 링크를 즉시 만들고 단체방에 바로
              공유해보세요.
            </p>
          </div>
          <Link
            href="/schedule/create"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-brand-purple text-xs font-bold text-white hover:bg-brand-purple-hover transition-all no-underline shadow-sm"
          >
            모임 생성하기 →
          </Link>
        </div>

        {/* Calendar Sync Status Card */}
        <div className="rounded-[1.5rem] border border-brand-border-muted bg-white p-6 shadow-premium hover:shadow-premium-lg transition-all duration-300 md:col-span-2">
          <h2 className="text-base font-extrabold text-brand-text-primary flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-brand-purple" />내 캘린더 연동
            현황 (시안 07)
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
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
                    연동 완료 · 자동 동기화 중
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-brand-purple bg-brand-purple-ring px-2.5 py-1 rounded-full border border-brand-border-muted">
                연동됨
              </span>
            </div>

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
                    연동 정보 없음
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/settings"
                className="text-[10px] font-bold text-brand-text-secondary hover:text-brand-purple hover:underline"
              >
                연동하기 →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Active Meetings */}
      <div className="rounded-[1.5rem] border border-brand-border-muted bg-white p-6 shadow-premium">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-extrabold text-brand-text-primary flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-brand-purple" />
            최근 일정 조율 현황 (시안 09)
          </h2>
          <Link
            href="/dashboard/meetings"
            className="text-xs font-bold text-brand-purple hover:underline"
          >
            모든 모임 보기
          </Link>
        </div>

        {recentSchedules.length === 0 ? (
          <div className="text-center py-12 text-brand-text-muted space-y-2">
            <p className="text-sm">현재 생성된 일정이 없습니다.</p>
            <p className="text-xs">
              상단의 새 모임 개설하기 버튼을 통해 일정을 생성해보세요!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto scroller-style">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border-muted text-xs font-bold text-brand-text-muted">
                  <th className="pb-3 font-bold">모임 이름</th>
                  <th className="pb-3 font-bold">상태</th>
                  <th className="pb-3 font-bold">참여 인원</th>
                  <th className="pb-3 font-bold">생성 일자</th>
                  <th className="pb-3 text-right font-bold">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border-muted text-xs">
                {recentSchedules.map((sched) => {
                  const isConfirmed = sched.status === "confirmed";
                  return (
                    <tr
                      key={sched.id}
                      className="hover:bg-brand-bg-light/30 transition-colors"
                    >
                      <td className="py-4 font-extrabold text-brand-text-primary">
                        {sched.title}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isConfirmed
                              ? "bg-green-50 text-green-600"
                              : "bg-brand-purple-ring text-brand-purple"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${isConfirmed ? "bg-green-500" : "bg-brand-purple animate-pulse"}`}
                          />
                          {isConfirmed ? "확정됨" : "조율 중"}
                        </span>
                      </td>
                      <td className="py-4 font-semibold text-brand-text-secondary flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-brand-text-muted" />
                        {sched._count.participants}명 참여
                      </td>
                      <td className="py-4 font-medium text-brand-text-muted">
                        {new Date(sched.createdAt).toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-4 text-right">
                        <Link
                          href={`/schedule/${sched.id}`}
                          className="inline-flex h-8 items-center justify-center rounded-lg border border-brand-border-gray bg-white px-3 text-[10px] font-bold text-brand-text-primary hover:border-brand-purple hover:bg-brand-bg-light transition-all no-underline"
                        >
                          방 진입
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
