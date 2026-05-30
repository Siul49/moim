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
} from "lucide-react";
import {
  EmptyAvatar,
  HeatmapGrid,
  MoimShell,
  MoimTopBar,
  PurpleButton,
} from "@/components/moim/reference-ui";
import { Button } from "@/components/ui/button";
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schedule) return;

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

  function toggleSlot(key: string, checked: boolean) {
    setSelected((current) =>
      checked
        ? [...current, key]
        : current.filter((currentKey) => currentKey !== key),
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
          <aside className="rounded-[2rem] border border-[#eee8f4] bg-gradient-to-br from-[#fbf7ff] via-white to-[#efe9fb] p-8">
            <p className="text-sm font-extrabold tracking-[0.16em] text-[#8f7bd6]">
              NEW INVITATION
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-normal text-[#222026]">
              이런 모임에
              <br />
              초대받았어요!
            </h1>

            <div className="mt-10 rounded-[1.75rem] border border-[#eee8f4] bg-white p-6 shadow-[0_18px_45px_rgba(95,82,130,0.12)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-[#8f7bd6]">
                    초대받은 모임
                  </p>
                  <h2 className="mt-2 text-3xl font-extrabold tracking-normal">
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
              <div className="mt-6 rounded-2xl bg-[#fbf7ff] p-4 text-sm font-semibold leading-6 text-[#6f6a73]">
                가능한 시간을 선택하면 호스트가 가장 많이 겹치는 시간으로 최종
                일정을 확정합니다.
              </div>
            </div>

            <QuickImportPanel
              everytimeUrl={everytimeUrl}
              importMessage={importMessage}
              importMode={importMode}
              onUrlChange={setEverytimeUrl}
              onUrlSubmit={importEverytimeUrl}
              onFileChange={importEverytimeFile}
            />
          </aside>

          <form
            onSubmit={handleSubmit}
            className="grid h-fit gap-6 rounded-[2rem] border border-[#eee8f4] bg-white p-6 shadow-[0_24px_70px_rgba(95,82,130,0.12)] sm:p-8"
          >
            <div>
              <p className="text-sm font-extrabold text-[#8f7bd6]">STEP 1</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-normal">
                가능한 시간을 알려주세요
              </h2>
            </div>

            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <label className="grid gap-3 text-lg font-extrabold">
              이름
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-14 rounded-xl border border-[#dedbe3] px-4 text-lg font-normal outline-none focus:border-[#8f7bd6] focus:ring-2 focus:ring-[#ece7fb]"
                maxLength={40}
                required
              />
            </label>

            <fieldset className="grid gap-3">
              <legend className="text-lg font-extrabold">가능 시간</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {slotOptions.map((option) => (
                  <label
                    key={option.key}
                    className="flex h-12 items-center gap-3 rounded-xl border border-[#dedbe3] bg-[#fbf7ff] px-4 text-sm font-bold text-[#4f4a55]"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(option.key)}
                      onChange={(event) =>
                        toggleSlot(option.key, event.target.checked)
                      }
                      className="h-5 w-5 rounded border-[#cfc8d9]"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            {status ? (
              <p className="flex items-center gap-2 rounded-2xl bg-[#eef8f0] p-4 text-sm font-bold text-[#23623a]">
                <CheckCircle2 className="h-4 w-4" />
                {status}
              </p>
            ) : null}

            <PurpleButton
              type="submit"
              className="w-full"
              disabled={isSubmitting || selected.length === 0}
            >
              {isSubmitting ? "제출 중" : "가능 시간 제출"}
            </PurpleButton>
          </form>
        </section>
      ) : null}
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
}: {
  everytimeUrl: string;
  importMessage: string;
  importMode: string;
  onUrlChange: (value: string) => void;
  onUrlSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFileChange: (file: File | null) => void;
}) {
  return (
    <div className="mt-6 grid gap-3 rounded-[1.5rem] border border-[#eee8f4] bg-white p-5">
      <div className="flex items-center gap-2 text-lg font-extrabold">
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
      <label className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-[#eee8f4] text-sm font-bold text-[#6252ac] hover:bg-[#fbf7ff]">
        ICS 파일 적용
        <input
          type="file"
          accept=".ics,text/calendar"
          className="sr-only"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
      </label>
      {importMessage ? (
        <p className="rounded-xl bg-[#fbf7ff] p-3 text-sm font-semibold text-[#6252ac]">
          {importMessage}
        </p>
      ) : null}
      <Link
        href="/calendar/connect"
        className="text-center text-sm font-bold text-[#8f7bd6]"
      >
        캘린더 연동 화면 보기
      </Link>
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
        <div className="rounded-[1.5rem] border border-[#eee8f4] bg-[#fbf7ff] p-5 text-sm font-bold text-[#6252ac]">
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
      <section className="grid gap-6 rounded-[2rem] border border-[#eee8f4] bg-white p-6 shadow-[0_24px_70px_rgba(95,82,130,0.12)] sm:p-8">
        {schedule.status === "confirmed" && schedule.confirmedSlot ? (
          <div className="rounded-[1.5rem] bg-[#eef8f0] p-5 text-[#23623a]">
            <p className="text-lg font-extrabold">시간이 확정되었습니다</p>
            <p className="mt-2 font-bold">
              {formatSlot(schedule.confirmedSlot)}
            </p>
          </div>
        ) : null}

        <div>
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-normal">
                모두가 가능한 시간
              </h2>
              <p className="mt-1 text-sm font-medium text-[#77727c]">
                색이 진할수록 더 많은 참여자가 선택한 시간입니다.
              </p>
            </div>
            <Clock3 className="h-6 w-6 text-[#8f7bd6]" />
          </div>
          <HeatmapGrid />
        </div>

        {schedule.participants.length === 0 ? (
          <p className="rounded-2xl bg-[#fbf7ff] p-4 text-sm font-bold text-[#77727c]">
            아직 제출한 참여자가 없습니다
          </p>
        ) : (
          <div className="grid gap-3" data-testid="common-slots">
            <h3 className="text-lg font-extrabold">추천 시간</h3>
            {schedule.commonSlots.length > 0 ? (
              <ul className="grid gap-3">
                {schedule.commonSlots.map((slot, index) => {
                  const key = `${slot.day}-${slot.startHour}-${slot.endHour}`;
                  return (
                    <li
                      key={key}
                      className="grid gap-4 rounded-[1.5rem] border border-[#eee8f4] bg-[#fbf7ff] p-5 sm:grid-cols-[1fr_auto] sm:items-center"
                    >
                      <div>
                        <p className="text-sm font-extrabold text-[#8f7bd6]">
                          {index + 1}순위
                        </p>
                        <p className="mt-1 text-xl font-extrabold">
                          {formatSlot(slot)}
                        </p>
                        <p className="mt-1 text-sm font-medium text-[#77727c]">
                          {schedule.participants.length}명 기준 전원 가능
                        </p>
                      </div>
                      <PurpleButton
                        type="button"
                        className="h-11 px-5 text-sm"
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
              <p className="rounded-2xl bg-[#fbf7ff] p-4 text-sm font-bold text-[#77727c]">
                아직 겹치는 시간이 없습니다
              </p>
            )}
            {confirmError ? (
              <p role="alert" className="text-sm text-destructive">
                {confirmError}
              </p>
            ) : null}
          </div>
        )}
      </section>

      <aside className="grid h-fit gap-5">
        <section className="rounded-[2rem] border border-[#eee8f4] bg-white p-6 shadow-[0_18px_45px_rgba(95,82,130,0.10)]">
          <div className="mb-5 flex items-center gap-2 text-xl font-extrabold">
            <Users className="h-5 w-5 text-[#6252ac]" />
            참여자 현황
          </div>
          <ul className="grid gap-3">
            {schedule.participants.length > 0 ? (
              schedule.participants.map((participant) => (
                <li
                  key={participant.id}
                  className="grid gap-2 rounded-2xl bg-[#fbf7ff] p-4"
                >
                  <div className="flex items-center gap-3">
                    <EmptyAvatar>{participant.name.slice(0, 1)}</EmptyAvatar>
                    <div>
                      <p className="font-extrabold">{participant.name}</p>
                      <p className="text-sm font-medium text-[#77727c]">
                        응답 완료
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium leading-6 text-[#6f6a73]">
                    {participant.available.map(formatSlot).join(", ")}
                  </p>
                </li>
              ))
            ) : (
              <li className="rounded-2xl bg-[#fbf7ff] p-4 text-sm font-bold text-[#77727c]">
                대기 중
              </li>
            )}
          </ul>
        </section>

        <button
          type="button"
          className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.25rem] bg-[#fee500] text-base font-extrabold text-[#191919]"
        >
          <MessageCircle className="h-5 w-5" />
          미응답자에게 알림 보내기
        </button>

        <section className="rounded-[2rem] border border-[#eee8f4] bg-[#fbf7ff] p-6">
          <div className="mb-4 flex items-center gap-2 text-lg font-extrabold">
            <CalendarClock className="h-5 w-5 text-[#6252ac]" />
            다음 단계
          </div>
          <p className="text-sm font-medium leading-6 text-[#77727c]">
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
