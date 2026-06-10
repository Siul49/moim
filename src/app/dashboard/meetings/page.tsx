import Link from "next/link";
import { CalendarDays, Clock, ExternalLink, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { DayCode } from "@/types/schedule";

export const dynamic = "force-dynamic";

const DAY_LABELS: Record<DayCode, string> = {
  MON: "월",
  TUE: "화",
  WED: "수",
  THU: "목",
  FRI: "금",
  SAT: "토",
  SUN: "일",
};

export default async function DashboardMeetingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch all schedules in the system to list on this page
  const schedules = await prisma.schedule.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { participants: true },
      },
    },
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-text-primary">
            내 모임 일정 관리
          </h1>
          <p className="text-xs text-brand-text-muted mt-1">
            진행 중이거나 확정된 모임 일정들의 현황입니다. (시안 09)
          </p>
        </div>
        <Link
          href="/schedule/create"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-brand-purple px-5 text-xs font-bold text-white hover:bg-brand-purple-hover transition-all shadow-md no-underline"
        >
          새 모임 만들기
        </Link>
      </div>

      {schedules.length === 0 ? (
        <div className="rounded-[1.5rem] border border-brand-border-muted bg-white p-12 text-center text-brand-text-muted space-y-3 shadow-premium">
          <CalendarDays className="h-12 w-12 text-brand-purple/40 mx-auto" />
          <p className="font-extrabold text-sm text-brand-text-primary">
            조율 중인 모임이 없습니다.
          </p>
          <p className="text-xs max-w-md mx-auto">
            팀원들과 함께 시간을 조율할 모임을 새로 만들어 초대 링크를
            공유해보세요.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {schedules.map((sched) => {
            const isConfirmed = sched.status === "confirmed";
            const candidateDays: DayCode[] = JSON.parse(sched.candidateDays);

            return (
              <div
                key={sched.id}
                className="rounded-[1.5rem] border border-brand-border-muted bg-white p-5 shadow-premium hover:shadow-premium-lg transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Status & Date */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        isConfirmed
                          ? "bg-green-50 text-green-600"
                          : "bg-brand-purple-ring text-brand-purple"
                      }`}
                    >
                      {isConfirmed ? "확정 완료" : "시간 조율 중"}
                    </span>
                    <span className="text-[10px] font-semibold text-brand-text-muted">
                      {new Date(sched.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="text-base font-extrabold text-brand-text-primary truncate">
                      {sched.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold text-brand-text-muted">
                      <span className="inline-flex items-center gap-1 bg-brand-bg-muted px-2 py-1 rounded-lg border border-brand-border-muted">
                        <Clock className="h-3 w-3 text-brand-purple" />
                        {sched.durationMinutes}분 소요
                      </span>
                      <span className="inline-flex items-center gap-1 bg-brand-bg-muted px-2 py-1 rounded-lg border border-brand-border-muted">
                        <Users className="h-3 w-3 text-brand-purple" />
                        {sched._count.participants}명 참여
                      </span>
                    </div>
                  </div>

                  {/* Candidate days details */}
                  <div className="border-t border-brand-border-muted pt-3">
                    <p className="text-[10px] font-bold text-brand-text-muted mb-1.5">
                      후보 요일
                    </p>
                    <div className="flex gap-1">
                      {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(
                        (day) => {
                          const isCandidate = candidateDays.includes(
                            day as DayCode,
                          );
                          return (
                            <span
                              key={day}
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-extrabold border ${
                                isCandidate
                                  ? "bg-brand-purple-ring text-brand-purple border-brand-purple-light/30"
                                  : "bg-white text-brand-text-light border-brand-border-gray"
                              }`}
                            >
                              {DAY_LABELS[day as DayCode]}
                            </span>
                          );
                        },
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-brand-border-muted flex gap-2">
                  <Link
                    href={`/schedule/${sched.id}`}
                    className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-brand-border-gray bg-white text-xs font-bold text-brand-text-primary hover:border-brand-purple hover:bg-brand-bg-light transition-all no-underline shadow-sm"
                  >
                    방 진입
                    <ExternalLink className="h-3.5 w-3.5 text-brand-text-muted" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
