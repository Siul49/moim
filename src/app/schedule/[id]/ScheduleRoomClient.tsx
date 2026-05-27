"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

  function toggleSlot(key: string, checked: boolean) {
    setSelected((current) =>
      checked
        ? [...current, key]
        : current.filter((currentKey) => currentKey !== key),
    );
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 sm:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            MOIM
          </Link>
          {isLoading ? (
            <h1 className="text-3xl font-semibold tracking-normal">
              불러오는 중
            </h1>
          ) : schedule ? (
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-normal">
                {schedule.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {schedule.durationMinutes}분 모임 · 현재{" "}
                {schedule.participantCount}명 제출
              </p>
            </div>
          ) : (
            <h1 className="text-3xl font-semibold tracking-normal">
              모임을 열 수 없습니다
            </h1>
          )}
        </header>

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}

        {schedule && isHostView ? (
          <HostResultPanel schedule={schedule as HostSchedule} />
        ) : null}

        {schedule && !isHostView ? (
          <form
            onSubmit={handleSubmit}
            className="grid gap-5 rounded-lg border border-border bg-card p-5"
          >
            <label className="grid gap-2 text-sm font-medium">
              이름
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-11 rounded-md border border-input bg-background px-3 text-base outline-none focus:ring-2 focus:ring-ring"
                maxLength={40}
                required
              />
            </label>

            <fieldset className="grid gap-3">
              <legend className="text-sm font-medium">가능 시간</legend>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {slotOptions.map((option) => (
                  <label
                    key={option.key}
                    className="flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(option.key)}
                      onChange={(event) =>
                        toggleSlot(option.key, event.target.checked)
                      }
                      className="h-4 w-4"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            {status ? (
              <p className="text-sm text-foreground">{status}</p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || selected.length === 0}
            >
              {isSubmitting ? "제출 중" : "가능 시간 제출"}
            </Button>
          </form>
        ) : null}
      </div>
    </main>
  );
}

function HostResultPanel({ schedule }: { schedule: HostSchedule }) {
  return (
    <section className="grid gap-5 rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">호스트 결과</h2>
        <p className="text-sm text-muted-foreground">
          이 화면은 host token이 있는 링크에서만 열립니다.
        </p>
      </div>

      {schedule.participants.length === 0 ? (
        <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
          아직 제출한 참여자가 없습니다
        </p>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-2" data-testid="common-slots">
            <h3 className="text-base font-semibold">공통 가능 시간</h3>
            {schedule.commonSlots.length > 0 ? (
              <ul className="grid gap-2">
                {schedule.commonSlots.map((slot) => (
                  <li
                    key={`${slot.day}-${slot.startHour}-${slot.endHour}`}
                    className="rounded-md bg-muted px-3 py-2 text-sm"
                  >
                    {formatSlot(slot)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                아직 겹치는 시간이 없습니다
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <h3 className="text-base font-semibold">참여자</h3>
            <ul className="grid gap-2">
              {schedule.participants.map((participant) => (
                <li
                  key={participant.id}
                  className="grid gap-1 rounded-md border border-border p-3"
                >
                  <span className="text-sm font-medium">
                    {participant.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {participant.available.map(formatSlot).join(", ")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
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
