"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileUp,
  MessageCircle,
  Users,
  X,
} from "lucide-react";
import {
  EmptyAvatar,
  HeatmapGrid,
  MoimShell,
  MoimTopBar,
  PurpleButton,
} from "@/components/moim/reference-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DayCode, TimeSlot } from "@/types/schedule";

interface PublicSchedule {
  id: string;
  title: string;
  durationMinutes: number;
  candidateDays: DayCode[];
  candidateStartHour: number;
  candidateEndHour: number;
  participantCount: number;
  status: "open" | "confirmed";
  confirmedSlot?: TimeSlot;
}

interface HostParticipant {
  id: string;
  name: string;
  available: TimeSlot[];
  submittedAt: string;
}

interface HostSchedule extends PublicSchedule {
  participants: HostParticipant[];
  commonSlots: TimeSlot[];
}

const DAY_LABELS: Record<DayCode, string> = {
  MON: "월요일",
  TUE: "화요일",
  WED: "수요일",
  THU: "목요일",
  FRI: "금요일",
  SAT: "토요일",
  SUN: "일요일",
};

export function ScheduleRoomClient({
  scheduleId,
  hostToken,
}: {
  scheduleId: string;
  hostToken: string;
}) {
  const [schedule, setSchedule] = useState<
    PublicSchedule | HostSchedule | null
  >(null);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [everytimeUrl, setEverytimeUrl] = useState("");
  const [importMode, setImportMode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // 드래그 상태 관리
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState<"select" | "deselect" | null>(
    null,
  );

  const handleMouseDown = (key: string) => {
    setIsDragging(true);
    const shouldSelect = !selected.includes(key);
    setDragAction(shouldSelect ? "select" : "deselect");
    setSelected((prev) =>
      shouldSelect ? [...prev, key] : prev.filter((k) => k !== key),
    );
  };

  const handleMouseEnter = (key: string) => {
    if (!isDragging || !dragAction) return;
    setSelected((prev) => {
      if (dragAction === "select") {
        return prev.includes(key) ? prev : [...prev, key];
      } else {
        return prev.filter((k) => k !== key);
      }
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragAction(null);
  };

  const handleTouchStart = (e: React.TouchEvent, key: string) => {
    setIsDragging(true);
    const shouldSelect = !selected.includes(key);
    setDragAction(shouldSelect ? "select" : "deselect");
    setSelected((prev) =>
      shouldSelect ? [...prev, key] : prev.filter((k) => k !== key),
    );
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !dragAction) return;
    const touch = e.touches[0];
    if (!touch) return;
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element) {
      const key = element.getAttribute("data-slot-key");
      if (key) {
        setSelected((prev) => {
          if (dragAction === "select") {
            return prev.includes(key) ? prev : [...prev, key];
          } else {
            return prev.filter((k) => k !== key);
          }
        });
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setDragAction(null);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setDragAction(null);
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  useEffect(() => {
    const query = hostToken
      ? `?hostToken=${encodeURIComponent(hostToken)}`
      : "";

    fetch(`/api/schedules/${scheduleId}${query}`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error ?? "모임을 찾을 수 없습니다.");
        setSchedule(result.schedule);
      })
      .catch((caught) => {
        setError(
          caught instanceof Error ? caught.message : "요청에 실패했습니다.",
        );
      })
      .finally(() => setIsLoading(false));
  }, [hostToken, scheduleId]);

  const slotOptions = useMemo(() => {
    if (!schedule) return [];

    const slots: { key: string; slot: TimeSlot; label: string }[] = [];
    for (const day of schedule.candidateDays) {
      for (
        let hour = schedule.candidateStartHour;
        hour < schedule.candidateEndHour;
        hour += 1
      ) {
        slots.push({
          key: `${day}-${hour}`,
          slot: { day, startHour: hour, endHour: hour + 1 },
          label: `${DAY_LABELS[day]} ${formatHour(hour)}-${formatHour(hour + 1)}`,
        });
      }
    }
    return slots;
  }, [schedule]);

  const isHostView = Boolean(schedule && "participants" in schedule);

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    if (event) event.preventDefault();
    if (!schedule || isSubmitting || selected.length === 0) return;

    setError("");
    setStatus("");
    setIsSubmitting(true);

    try {
      const available = slotOptions
        .filter((option) => selected.includes(option.key))
        .map((option) => option.slot);

      const response = await fetch(
        `/api/schedules/${schedule.id}/availability`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, available }),
        },
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "가능 시간을 제출할 수 없습니다.");
      }

      setSchedule(result.schedule);
      setStatus("가능 시간이 제출됐습니다");
      setName("");
      setSelected([]);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "요청에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function importEverytimeUrl(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schedule) return;

    setImportMessage("");
    setImportMode("url");
    try {
      const response = await fetch(
        `/api/everytime/timetable?days=${schedule.candidateDays.join(",")}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: everytimeUrl }),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "시간표를 가져오지 못했습니다.");
      }
      applyImportedSlots(result.freeSlots ?? []);
    } catch (caught) {
      setImportMessage(
        caught instanceof Error ? caught.message : "요청에 실패했습니다.",
      );
    } finally {
      setImportMode("");
    }
  }

  async function importEverytimeFile(file: File | null) {
    if (!schedule || !file) return;

    const isIcs =
      file.type === "text/calendar" || file.name.toLowerCase().endsWith(".ics");
    const maxSize = 100 * 1024;
    if (!isIcs) {
      setImportMessage("ICS 형식 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > maxSize) {
      setImportMessage("파일 크기는 100KB 이하여야 합니다.");
      return;
    }

    setImportMessage("");
    setImportMode("file");
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch(
        `/api/everytime/timetable?days=${schedule.candidateDays.join(",")}`,
        {
          method: "POST",
          body: formData,
        },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "ICS 파일을 읽지 못했습니다.");
      }
      applyImportedSlots(result.freeSlots ?? []);
    } catch (caught) {
      setImportMessage(
        caught instanceof Error ? caught.message : "요청에 실패했습니다.",
      );
    } finally {
      setImportMode("");
    }
  }

  function applyImportedSlots(freeSlots: TimeSlot[]) {
    const importedKeys = slotOptions
      .filter((option) =>
        freeSlots.some((slot) => containsSlot(slot, option.slot)),
      )
      .map((option) => option.key);
    setSelected(importedKeys);
    setImportMessage(
      importedKeys.length > 0
        ? `${importedKeys.length}개 시간대를 자동 선택했습니다.`
        : "후보 시간 안에서 비어 있는 시간을 찾지 못했습니다.",
    );
  }

  return (
    <MoimShell className="bg-white">
      <MoimTopBar activeHref="/schedule/create" />

      {isLoading ? (
        <section className="mx-auto max-w-6xl px-6 py-20">
          <h1 className="text-3xl font-extrabold">불러오는 중</h1>
        </section>
      ) : null}

      {!isLoading && !schedule ? (
        <section className="mx-auto max-w-6xl px-6 py-20">
          <h1 className="text-3xl font-extrabold">모임을 열 수 없습니다</h1>
          {error ? (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </section>
      ) : null}

      {schedule && isHostView ? (
        <HostView
          schedule={schedule as HostSchedule}
          hostToken={hostToken}
          onScheduleUpdate={setSchedule}
        />
      ) : null}

      {schedule && !isHostView ? (
        <section className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="rounded-[2.5rem] border border-[#eee8f4] bg-gradient-to-br from-[#fcfaff] via-[#f5efff] to-white p-8 shadow-premium relative overflow-hidden">
            <div className="absolute top-0 right-0 h-40 w-40 bg-[#e9ddff]/30 rounded-full blur-3xl pointer-events-none" />
            <p className="text-xs font-black tracking-[0.2em] text-[#8f7bd6] uppercase">
              NEW INVITATION
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-normal text-[#222026] bg-clip-text text-transparent bg-gradient-to-br from-[#222026] to-[#5f5865]">
              이런 모임에
              <br />
              초대받았어요!
            </h1>

            <div className="mt-10 rounded-[2rem] border border-[#eee8f4] bg-white p-6 shadow-premium relative overflow-hidden">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-[#8f7bd6] uppercase tracking-wider">
                    초대받은 모임
                  </p>
                  <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#222026]">
                    {schedule.title}
                  </h2>
                </div>
                <EmptyAvatar>{schedule.participantCount}</EmptyAvatar>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InviteMetric
                  label="소요 시간"
                  value={`${schedule.durationMinutes}분`}
                />
                <InviteMetric
                  label="후보 시간"
                  value={`${formatHour(schedule.candidateStartHour)}-${formatHour(
                    schedule.candidateEndHour,
                  )}`}
                />
              </div>
              <div className="mt-6 rounded-2xl bg-[#fcfaff] p-4 text-xs font-semibold leading-relaxed text-[#77727c] border border-[#eee8f4]">
                가능한 시간을 마우스로 드래그하여 간편하게 알려주세요. 호스트가
                전원 겹치는 최적의 시간을 찾아냅니다.
              </div>
            </div>

            <QuickImportPanel
              everytimeUrl={everytimeUrl}
              importMessage={importMessage}
              importMode={importMode}
              onUrlChange={setEverytimeUrl}
              onUrlSubmit={importEverytimeUrl}
              onFileChange={importEverytimeFile}
              onConnectCalendarClick={() => setShowPremiumModal(true)}
            />
          </aside>

          {schedule.status === "confirmed" && schedule.confirmedSlot ? (
            <ConfirmedGuestPanel slot={schedule.confirmedSlot} />
          ) : (
            <form
              onSubmit={(e) => e.preventDefault()}
              className="grid h-fit gap-6 rounded-[2rem] border border-[#eee8f4] bg-white p-6 shadow-premium-lg sm:p-8 hover:shadow-[0_30px_80px_rgba(95,82,130,0.14)] transition-all"
            >
              <div>
                <p className="text-xs font-extrabold text-[#8f7bd6] tracking-wider uppercase">
                  STEP 1
                </p>
                <h2 className="mt-2 text-3xl font-extrabold tracking-normal text-[#222026]">
                  가능한 시간을 알려주세요
                </h2>
              </div>

              {error ? (
                <p
                  role="alert"
                  className="text-sm text-destructive font-semibold"
                >
                  {error}
                </p>
              ) : null}

              <label className="grid gap-3 text-lg font-extrabold text-[#222026]">
                이름
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-12 rounded-xl border border-[#dedbe3] px-4 text-base font-normal outline-none focus:border-[#8f7bd6] focus:ring-2 focus:ring-[#ece7fb] transition-all"
                  maxLength={40}
                  required
                />
              </label>

              <fieldset className="grid gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <legend className="text-lg font-extrabold text-[#222026]">
                    가능 시간 선택
                  </legend>
                  <span className="text-xs text-[#8f7bd6] font-semibold">
                    드래그하여 여러 칸을 한번에 선택할 수 있습니다.
                  </span>
                </div>
                <div className="overflow-x-auto scroller-style rounded-2xl border border-[#eee8f4] bg-[#fbf7ff] p-4 shadow-inner">
                  <div
                    className="grid gap-1 select-none"
                    style={{
                      gridTemplateColumns: `60px repeat(${schedule.candidateDays.length}, minmax(0, 1fr))`,
                      minWidth: `${Math.max(440, schedule.candidateDays.length * 90)}px`,
                    }}
                    onMouseLeave={handleMouseUp}
                  >
                    {/* 헤더 행: 요일 표시 */}
                    <div />
                    {schedule.candidateDays.map((day) => (
                      <div
                        key={day}
                        className="flex h-8 items-center justify-center pb-2 text-center text-sm font-bold text-[#6f5ec8]"
                      >
                        {DAY_LABELS[day]}
                      </div>
                    ))}

                    {/* 시간 행들 */}
                    {Array.from(
                      {
                        length:
                          schedule.candidateEndHour -
                          schedule.candidateStartHour,
                      },
                      (_, i) => schedule.candidateStartHour + i,
                    ).map((hour) => (
                      <div key={hour} className="contents">
                        {/* 첫 번째 열: 시간 표시 */}
                        <div className="flex items-center justify-end pr-2 text-xs font-semibold text-[#aaa5ad] h-10">
                          {formatHour(hour)}
                        </div>
                        {/* 각 요일별 셀 */}
                        {schedule.candidateDays.map((day) => {
                          const key = `${day}-${hour}`;
                          const isSelected = selected.includes(key);
                          return (
                            <div
                              key={key}
                              data-slot-key={key}
                              onMouseDown={() => handleMouseDown(key)}
                              onMouseEnter={() => handleMouseEnter(key)}
                              onTouchStart={(e) => handleTouchStart(e, key)}
                              onTouchMove={handleTouchMove}
                              onTouchEnd={handleTouchEnd}
                              className={cn(
                                "h-10 rounded border transition-all cursor-pointer touch-none",
                                isSelected
                                  ? "bg-gradient-to-r from-[#8f7bd6] to-[#7d68c9] border-[#7d68c9] shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)] scale-[0.98]"
                                  : "bg-white border-[#dedbe3] hover:bg-[#fbf7ff]",
                              )}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </fieldset>

              {status ? (
                <div className="grid gap-4 animate-fadeIn">
                  <p className="flex items-center gap-2 rounded-2xl bg-[#eef8f0] p-4 text-sm font-bold text-[#23623a] shadow-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    {status}
                  </p>

                  {/* BM Nudge 3: 참여 완료 후 단체/동아리용 스페이스 홍보 배너 */}
                  <div className="rounded-2xl border border-[#ece7fb] bg-gradient-to-br from-[#fcfaff] via-[#f7f3ff] to-white p-5 text-left shadow-sm">
                    <div className="flex gap-3">
                      <span className="text-xl">👥</span>
                      <div>
                        <p className="font-extrabold text-[#6252ac] text-sm sm:text-base">
                          매주 모임 잡느라 스트레스 받으시나요?
                        </p>
                        <p className="mt-1 text-xs font-semibold leading-relaxed text-[#77727c]">
                          조별과제, 동아리 부원 20명의 캘린더를 상시 동기화해
                          실시간 빈 시간을 모아보세요. 비가입자 초대 없이 즉시
                          확정 가능한 스페이스 오픈!
                        </p>
                        <div className="mt-4 flex gap-2">
                          <Link
                            href="/signup?redirect=/workspace"
                            className="inline-flex h-9 items-center justify-center rounded-xl bg-[#8f7bd6] px-4.5 text-xs font-bold text-white hover:bg-[#7d68c9] transition-all hover:scale-[1.02] shadow-sm"
                          >
                            동아리 스페이스 개설하기 (14일 무료)
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <PurpleButton
                type="button"
                onClick={() => handleSubmit()}
                className={cn(
                  "w-full text-base font-bold tracking-wide transition-all active:scale-[0.98]",
                  (isSubmitting || selected.length === 0) &&
                    "opacity-50 cursor-not-allowed",
                )}
              >
                {isSubmitting ? "제출 중" : "가능 시간 제출"}
              </PurpleButton>
            </form>
          )}
        </section>
      ) : null}

      {/* BM Nudge 2: Premium 업그레이드 유도 모달 */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-[2.5rem] border border-[#f0eaf8] bg-white p-8 shadow-premium-lg text-center relative animate-scaleIn">
            <button
              type="button"
              onClick={() => setShowPremiumModal(false)}
              className="absolute right-6 top-6 rounded-full p-1.5 text-[#aaa] hover:bg-[#f0eaf8] hover:text-[#555] transition-colors"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f2eefd] text-2xl text-[#6252ac] shadow-inner mb-6">
              👑
            </span>
            <h3 className="text-2xl font-extrabold text-[#222026]">
              MOIM Premium
            </h3>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-[#77727c]">
              두 개 이상의 외부 캘린더(구글 + Apple)를 동시 연동하여 실시간으로
              빈 시간을 중복 분석하려면 프리미엄 가입이 필요합니다.
            </p>
            <div className="my-6 rounded-2xl bg-[#fcfaff] p-4 text-xs font-bold text-[#6252ac] border border-[#eeeaf9]">
              첫 달 900원 (이후 월 2,900원) · 광고 완전 제거
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPremiumModal(false)}
                className="flex-1 h-12 rounded-xl border border-[#eee8f4] text-sm font-bold text-[#6252ac] hover:bg-[#fbf9ff] transition-all"
              >
                다음에 할게요
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("데모 결제가 완수되었습니다!");
                  setShowPremiumModal(false);
                }}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#8f7bd6] to-[#6252ac] text-sm font-bold text-white shadow-md hover:opacity-90 transition-all hover:scale-[1.02]"
              >
                지금 업그레이드
              </button>
            </div>
          </div>
        </div>
      )}
    </MoimShell>
  );
}

function QuickImportPanel({
  everytimeUrl,
  importMessage,
  importMode,
  onUrlChange,
  onUrlSubmit,
  onFileChange,
  onConnectCalendarClick,
}: {
  everytimeUrl: string;
  importMessage: string;
  importMode: string;
  onUrlChange: (value: string) => void;
  onUrlSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFileChange: (file: File | null) => void;
  onConnectCalendarClick: () => void;
}) {
  return (
    <div className="mt-6 grid gap-3 rounded-[1.5rem] border border-[#eee8f4] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-lg font-extrabold text-[#222026]">
        <FileUp className="h-5 w-5 text-[#6252ac]" />
        빠른 입력
      </div>
      <form onSubmit={onUrlSubmit} className="flex gap-2">
        <input
          value={everytimeUrl}
          onChange={(event) => onUrlChange(event.target.value)}
          placeholder="https://everytime.kr/@..."
          className="h-11 min-w-0 flex-1 rounded-xl border border-[#dedbe3] px-3 text-sm outline-none focus:border-[#8f7bd6] focus:ring-2 focus:ring-[#ece7fb]"
        />
        <Button
          type="submit"
          variant="outline"
          className="h-11 rounded-xl border-[#eee8f4] text-[#6252ac]"
          disabled={importMode === "url"}
        >
          적용
        </Button>
      </form>
      <label className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-[#eee8f4] text-sm font-bold text-[#6252ac] hover:bg-[#fbf7ff] transition-all shadow-sm">
        ICS 파일 적용
        <input
          type="file"
          accept=".ics,text/calendar"
          className="sr-only"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
      </label>
      {importMessage ? (
        <p className="rounded-xl bg-[#fbf7ff] p-3 text-sm font-semibold text-[#6252ac] border border-[#eee8f4]">
          {importMessage}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onConnectCalendarClick}
        className="text-center text-sm font-bold text-[#8f7bd6] hover:underline"
      >
        캘린더 연동 화면 보기
      </button>
    </div>
  );
}

function InviteMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#fbf7ff] p-4">
      <p className="text-sm font-bold text-[#77727c]">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-[#222026]">{value}</p>
    </div>
  );
}

function ConfirmedGuestPanel({ slot }: { slot: TimeSlot }) {
  return (
    <section className="grid h-fit gap-4 rounded-[2rem] border border-[#d8efd7] bg-[#f4fbf4] p-8 text-[#23623a] shadow-[0_24px_70px_rgba(95,82,130,0.10)]">
      <CheckCircle2 className="h-10 w-10" />
      <div>
        <p className="text-sm font-extrabold">CONFIRMED</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-normal">
          일정이 확정되었습니다
        </h2>
        <p className="mt-3 text-lg font-bold">{formatSlot(slot)}</p>
      </div>
    </section>
  );
}

function HostView({
  schedule,
  hostToken,
  onScheduleUpdate,
}: {
  schedule: HostSchedule;
  hostToken: string;
  onScheduleUpdate: (schedule: HostSchedule) => void;
}) {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-28 pt-12">
      <div className="mb-10 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-extrabold text-[#8f7bd6]">
            일정 조율 현황
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-normal text-[#222026] sm:text-5xl">
            {schedule.title}
          </h1>
          <p className="mt-4 text-lg font-medium text-[#6f6a73]">
            {schedule.participantCount}명이 응답했습니다. 공통 가능 시간을
            확인하고 최종 일정을 확정하세요.
          </p>
        </div>
        <div className="rounded-xl border border-[#eee8f4] bg-[#fbf7ff] px-4 py-2 text-sm font-bold text-[#6252ac] h-fit">
          {schedule.status === "confirmed" && schedule.confirmedSlot
            ? "확정 완료"
            : "응답 수집 중"}
        </div>
      </div>

      <HostResultPanel
        schedule={schedule}
        hostToken={hostToken}
        onScheduleUpdate={onScheduleUpdate}
      />
    </section>
  );
}

function HostResultPanel({
  schedule,
  hostToken,
  onScheduleUpdate,
}: {
  schedule: HostSchedule;
  hostToken: string;
  onScheduleUpdate: (schedule: HostSchedule) => void;
}) {
  const [confirmingKey, setConfirmingKey] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const heatmapRows = useMemo(() => {
    const r = [];
    for (
      let h = schedule.candidateStartHour;
      h < schedule.candidateEndHour;
      h++
    ) {
      r.push(formatHour(h));
    }
    return r;
  }, [schedule.candidateStartHour, schedule.candidateEndHour]);

  const heatmapDays = useMemo(() => {
    return schedule.candidateDays.map((d) => DAY_LABELS[d] || d);
  }, [schedule.candidateDays]);

  const heatmapColors = useMemo(() => {
    const total = schedule.participants.length;
    return heatmapRows.map((_, rowIndex) => {
      const hour = schedule.candidateStartHour + rowIndex;
      return schedule.candidateDays.map((dayCode) => {
        if (total === 0) return "bg-[#fbf7ff]";
        const count = schedule.participants.filter((p) =>
          p.available.some(
            (slot) =>
              slot.day === dayCode &&
              slot.startHour <= hour &&
              slot.endHour >= hour + 1,
          ),
        ).length;
        const ratio = count / total;
        if (count === 0) return "bg-[#fbf7ff]";
        if (ratio <= 0.25) return "bg-[#eeeaf7]";
        if (ratio <= 0.5) return "bg-[#c9c1eb]";
        if (ratio <= 0.75) return "bg-[#9683d5]";
        return "bg-[#8f7bd6] ring-2 ring-white";
      });
    });
  }, [
    schedule.participants,
    schedule.candidateDays,
    schedule.candidateStartHour,
    heatmapRows,
  ]);

  const heatmapTooltips = useMemo(() => {
    const total = schedule.participants.length;
    return heatmapRows.map((_, rowIndex) => {
      const hour = schedule.candidateStartHour + rowIndex;
      return schedule.candidateDays.map((dayCode) => {
        if (total === 0) return "선택한 참여자 없음";
        const availableParticipants = schedule.participants
          .filter((p) =>
            p.available.some(
              (slot) =>
                slot.day === dayCode &&
                slot.startHour <= hour &&
                slot.endHour >= hour + 1,
            ),
          )
          .map((p) => p.name);

        if (availableParticipants.length === 0) {
          return "가능한 참여자 없음";
        }
        return `${availableParticipants.join(", ")} (${availableParticipants.length}/${total}명)`;
      });
    });
  }, [
    schedule.participants,
    schedule.candidateDays,
    schedule.candidateStartHour,
    heatmapRows,
  ]);

  async function confirmSlot(slot: TimeSlot) {
    setConfirmError("");
    const key = `${slot.day}-${slot.startHour}-${slot.endHour}`;
    setConfirmingKey(key);

    try {
      const response = await fetch(`/api/schedules/${schedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostToken, confirmedSlot: slot }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "일정을 확정할 수 없습니다.");
      }
      onScheduleUpdate(result.schedule);
    } catch (caught) {
      setConfirmError(
        caught instanceof Error ? caught.message : "요청에 실패했습니다.",
      );
    } finally {
      setConfirmingKey("");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <section className="grid gap-6 rounded-[2rem] border border-[#eee8f4] bg-white p-6 shadow-premium-lg sm:p-8">
        {schedule.status === "confirmed" && schedule.confirmedSlot ? (
          <div className="grid gap-4 animate-fadeIn">
            <div className="rounded-[1.5rem] bg-[#eef8f0] p-5 text-[#23623a] border border-[#d2edd5] shadow-sm">
              <p className="text-lg font-extrabold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#23623a]" />
                시간이 확정되었습니다
              </p>
              <p className="mt-2 font-black text-2xl">
                {formatSlot(schedule.confirmedSlot)}
              </p>
            </div>

            {/* BM Nudge 4: 일정 확정 후 모임 공간 제휴 광고 배너 */}
            <div className="rounded-2xl border border-[#ded4f7] bg-gradient-to-br from-[#fcfaff] via-[#f5efff] to-white p-5 shadow-premium text-left">
              <div className="flex gap-3">
                <span className="text-xl">📍</span>
                <div>
                  <p className="font-extrabold text-[#6252ac] text-sm sm:text-base">
                    모임 장소가 필요하신가요?
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-[#77727c]">
                    확정된 일정에 맞춰 모임 장소 근처의 제휴 스터디룸 및 카페
                    공간을 예약하고 2시간 무료 연장 혜택을 받으세요!
                  </p>
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() =>
                        alert("제휴 스터디룸 예약 페이지로 이동합니다. (데모)")
                      }
                      className="inline-flex h-9 items-center justify-center rounded-xl bg-[#8f7bd6] px-4 text-xs font-bold text-white hover:bg-[#7d68c9] transition-all hover:scale-[1.02] shadow-sm"
                    >
                      제휴 공간 혜택 보기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#222026]">
                모두가 가능한 시간
              </h2>
              <p className="mt-1 text-sm font-medium text-[#77727c]">
                색이 진할수록 더 많은 참여자가 선택한 시간입니다.
              </p>
            </div>
            <Clock3 className="h-6 w-6 text-[#8f7bd6]" />
          </div>
          <HeatmapGrid
            rows={heatmapRows}
            days={heatmapDays}
            colors={heatmapColors}
            cellTooltips={heatmapTooltips}
          />
        </div>

        {schedule.participants.length === 0 ? (
          <p className="rounded-2xl bg-[#fbf7ff] p-4 text-sm font-bold text-[#77727c] border border-[#eee8f4]">
            아직 제출한 참여자가 없습니다
          </p>
        ) : (
          <div className="grid gap-3" data-testid="common-slots">
            <h3 className="text-lg font-extrabold text-[#222026]">추천 시간</h3>
            {schedule.commonSlots.length > 0 ? (
              <ul className="grid gap-3">
                {schedule.commonSlots.map((slot, index) => {
                  const key = `${slot.day}-${slot.startHour}-${slot.endHour}`;
                  return (
                    <li
                      key={key}
                      className="grid gap-4 rounded-[1.5rem] border border-[#eee8f4] bg-gradient-to-br from-[#fcfaff] to-white p-5 sm:grid-cols-[1fr_auto] sm:items-center shadow-premium hover:border-[#8f7bd6] transition-all duration-200"
                    >
                      <div>
                        <span className="inline-flex items-center rounded-full bg-[#f3eefd] px-3 py-1 text-xs font-bold text-[#6252ac]">
                          {index + 1}순위 추천
                        </span>
                        <p className="mt-2 text-xl font-extrabold text-[#222026]">
                          {formatSlot(slot)}
                        </p>
                        <p className="mt-1 text-xs font-bold text-[#8f7bd6]">
                          {schedule.participants.length}명 기준 전원 가능
                        </p>
                      </div>
                      <PurpleButton
                        type="button"
                        className="h-11 px-5 text-sm font-bold shadow-sm"
                        disabled={
                          schedule.status === "confirmed" ||
                          confirmingKey === key
                        }
                        onClick={() => confirmSlot(slot)}
                      >
                        {confirmingKey === key ? "확정 중" : "이 시간 확정"}
                      </PurpleButton>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-2xl bg-[#fbf7ff] p-4 text-sm font-bold text-[#77727c] border border-[#eee8f4]">
                아직 겹치는 시간이 없습니다
              </p>
            )}
            {confirmError ? (
              <p
                role="alert"
                className="text-sm text-destructive font-semibold"
              >
                {confirmError}
              </p>
            ) : null}
          </div>
        )}
      </section>

      <aside className="grid h-fit gap-5">
        <section className="rounded-[2rem] border border-[#eee8f4] bg-white p-6 shadow-premium">
          <div className="mb-5 flex items-center gap-2 text-xl font-extrabold text-[#222026]">
            <Users className="h-5 w-5 text-[#6252ac]" />
            참여자 현황
          </div>
          <ul className="grid gap-3">
            {schedule.participants.length > 0 ? (
              schedule.participants.map((participant) => (
                <li
                  key={participant.id}
                  className="grid gap-2 rounded-2xl bg-[#fbf7ff] p-4 border border-[#eee8f4] hover:border-[#8f7bd6] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <EmptyAvatar>{participant.name.slice(0, 1)}</EmptyAvatar>
                    <div>
                      <p className="font-extrabold text-[#222026]">
                        {participant.name}
                      </p>
                      <p className="text-xs font-semibold text-[#8f7bd6]">
                        응답 완료
                      </p>
                    </div>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed text-[#77727c]">
                    {participant.available.map(formatSlot).join(", ")}
                  </p>
                </li>
              ))
            ) : (
              <li className="rounded-2xl bg-[#fbf7ff] p-4 text-sm font-bold text-[#77727c] border border-[#eee8f4]">
                대기 중
              </li>
            )}
          </ul>
        </section>

        <button
          type="button"
          onClick={() =>
            alert("미응답 멤버들에게 카카오톡 리마인더를 전송했습니다! (데모)")
          }
          className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.25rem] bg-[#fee500] text-base font-extrabold text-[#191919] hover:bg-[#ebd200] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
        >
          <MessageCircle className="h-5 w-5" />
          미응답자에게 카톡 알림 보내기
        </button>

        <section className="rounded-[2rem] border border-[#eee8f4] bg-[#fbf7ff] p-6">
          <div className="mb-4 flex items-center gap-2 text-lg font-extrabold text-[#222026]">
            <CalendarClock className="h-5 w-5 text-[#6252ac]" />
            다음 단계
          </div>
          <p className="text-xs font-semibold leading-relaxed text-[#77727c]">
            시간이 확정되면 참여자에게 공유할 일정 카드와 장소 안내 화면을
            이어서 확인할 수 있습니다.
          </p>
        </section>
      </aside>
    </div>
  );
}

function formatSlot(slot: TimeSlot): string {
  return `${DAY_LABELS[slot.day]} ${formatHour(slot.startHour)}-${formatHour(
    slot.endHour,
  )}`;
}

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

function containsSlot(container: TimeSlot, target: TimeSlot): boolean {
  return (
    container.day === target.day &&
    container.startHour <= target.startHour &&
    container.endHour >= target.endHour
  );
}
