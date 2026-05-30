"use client";

import { FormEvent, useState } from "react";
import type { ReactNode } from "react";
import {
  CalendarCheck2,
  ChevronRight,
  LockKeyhole,
  ShieldCheck,
  Upload,
} from "lucide-react";
import {
  MoimShell,
  MoimTopBar,
  ProviderGlyph,
  PurpleButton,
} from "@/components/moim/reference-ui";
import type { TimeSlot } from "@/types/schedule";

export default function CalendarConnectPage() {
  const [everytimeUrl, setEverytimeUrl] = useState("");
  const [icloudAppleId, setIcloudAppleId] = useState("");
  const [icloudPassword, setIcloudPassword] = useState("");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState("");

  async function submitEverytimeUrl(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsLoading("everytime-url");
    try {
      const response = await fetch("/api/everytime/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: everytimeUrl }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "시간표를 가져오지 못했습니다.");
      }
      setSlots(result.freeSlots ?? []);
      setMessage("Everytime 시간표를 가능한 시간으로 변환했습니다.");
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : "요청에 실패했습니다.",
      );
    } finally {
      setIsLoading("");
    }
  }

  async function submitEverytimeFile(file: File | null) {
    if (!file) return;
    const isIcs =
      file.type === "text/calendar" || file.name.toLowerCase().endsWith(".ics");
    const maxSize = 2 * 1024 * 1024;
    if (!isIcs) {
      setMessage("ICS 형식 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > maxSize) {
      setMessage("파일 크기는 2MB 이하여야 합니다.");
      return;
    }

    setMessage("");
    setIsLoading("everytime-file");
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/everytime/timetable", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "ICS 파일을 읽지 못했습니다.");
      }
      setSlots(result.freeSlots ?? []);
      setMessage("ICS 파일을 가능한 시간으로 변환했습니다.");
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : "요청에 실패했습니다.",
      );
    } finally {
      setIsLoading("");
    }
  }

  async function submitIcloud(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsLoading("icloud");
    try {
      const response = await fetch("/api/icloud/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appleId: icloudAppleId,
          appPassword: icloudPassword,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "iCloud 연결에 실패했습니다.");
      }
      setMessage("iCloud 캘린더 연결을 확인했습니다.");
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : "요청에 실패했습니다.",
      );
    } finally {
      setIsLoading("");
    }
  }

  return (
    <MoimShell className="bg-white">
      <MoimTopBar activeHref="/calendar/connect" help />

      <section className="mx-auto max-w-[920px] px-6 pb-24 pt-14">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-normal text-[#222026] sm:text-5xl">
            캘린더 연동
          </h1>
          <p className="mt-5 text-lg font-medium leading-8 text-[#6f6a73]">
            흩어진 일정을 하나로 모아 모임 가능한 시간만 추려냅니다.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-[2rem] border border-[#eee8f4] bg-white shadow-[0_20px_60px_rgba(95,82,130,0.12)]">
          <IntegrationRow
            glyph={<ProviderGlyph type="google" />}
            title="Google 캘린더"
            description="업무와 개인 일정을 실시간으로 불러옵니다."
            action={
              <a
                href="/api/google/auth"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#8f7bd6] px-5 text-sm font-bold text-white hover:bg-[#7d68c9]"
              >
                연동하기
              </a>
            }
          />

          <IntegrationRow
            glyph={<ProviderGlyph type="apple" />}
            title="Apple 캘린더"
            description="Apple ID와 앱 전용 암호로 iCloud 일정을 확인합니다."
            action={
              <form
                onSubmit={submitIcloud}
                className="grid w-full gap-2 sm:w-[420px] sm:grid-cols-[1fr_1fr_auto]"
              >
                <input
                  value={icloudAppleId}
                  onChange={(event) => setIcloudAppleId(event.target.value)}
                  placeholder="user@icloud.com"
                  className="h-11 rounded-xl border border-[#e5dfeb] px-3 text-sm outline-none focus:border-[#8f7bd6] focus:ring-2 focus:ring-[#ece7fb]"
                  type="email"
                  required
                />
                <input
                  value={icloudPassword}
                  onChange={(event) => setIcloudPassword(event.target.value)}
                  placeholder="앱 전용 암호"
                  className="h-11 rounded-xl border border-[#e5dfeb] px-3 text-sm outline-none focus:border-[#8f7bd6] focus:ring-2 focus:ring-[#ece7fb]"
                  type="password"
                  required
                />
                <PurpleButton
                  type="submit"
                  className="h-11 px-5 text-sm"
                  disabled={isLoading === "icloud"}
                >
                  {isLoading === "icloud" ? "확인 중" : "확인"}
                </PurpleButton>
              </form>
            }
          />

          <IntegrationRow
            glyph={<ProviderGlyph type="everytime" />}
            title="Everytime"
            description="공유 URL을 가능한 시간 블록으로 변환합니다."
            action={
              <form
                onSubmit={submitEverytimeUrl}
                className="flex w-full gap-2 sm:w-[420px]"
              >
                <input
                  value={everytimeUrl}
                  onChange={(event) => setEverytimeUrl(event.target.value)}
                  placeholder="https://everytime.kr/@..."
                  className="h-11 min-w-0 flex-1 rounded-xl border border-[#e5dfeb] px-3 text-sm outline-none focus:border-[#8f7bd6] focus:ring-2 focus:ring-[#ece7fb]"
                  required
                />
                <PurpleButton
                  type="submit"
                  className="h-11 px-5 text-sm"
                  disabled={isLoading === "everytime-url"}
                >
                  가져오기
                </PurpleButton>
              </form>
            }
          />

          <IntegrationRow
            glyph={<ProviderGlyph type="ics" />}
            title=".ics 파일 업로드"
            description="기타 캘린더 파일을 직접 올려서 확인합니다."
            action={
              <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#e5dfeb] bg-white px-5 text-sm font-bold text-[#6252ac] hover:bg-[#fbf7ff]">
                <Upload className="h-4 w-4" />
                파일 선택
                <input
                  type="file"
                  accept=".ics,text/calendar"
                  className="sr-only"
                  onChange={(event) =>
                    submitEverytimeFile(event.target.files?.[0] ?? null)
                  }
                />
              </label>
            }
          />
        </div>

        {message ? (
          <p className="mt-6 rounded-2xl border border-[#eee8f4] bg-[#fbf7ff] p-4 text-sm font-semibold text-[#6252ac]">
            {message}
          </p>
        ) : null}

        {slots.length > 0 ? (
          <section className="mt-8 rounded-[2rem] border border-[#eee8f4] bg-[#fbf7ff] p-6">
            <div className="mb-4 flex items-center gap-2 text-lg font-bold">
              <CalendarCheck2 className="h-5 w-5 text-[#6252ac]" />
              변환된 가능 시간
            </div>
            <div className="flex flex-wrap gap-2">
              {slots.slice(0, 14).map((slot) => (
                <span
                  key={`${slot.day}-${slot.startHour}-${slot.endHour}`}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#4f4a55]"
                >
                  {slot.day} {slot.startHour}:00-{slot.endHour}:00
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <InfoCard
            icon={<ShieldCheck className="h-5 w-5 text-[#6252ac]" />}
            title="공개 범위"
            body="제목과 메모는 참여자에게 공개하지 않고, 후보 시간 판단에 필요한 빈 시간만 사용합니다."
          />
          <InfoCard
            icon={<LockKeyhole className="h-5 w-5 text-[#6252ac]" />}
            title="권한 관리"
            body="연동은 선택 사항이며, 실패해도 직접 입력이나 파일 업로드로 계속 진행할 수 있습니다."
          />
        </div>
      </section>
    </MoimShell>
  );
}

function IntegrationRow({
  glyph,
  title,
  description,
  action,
}: {
  glyph: ReactNode;
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <div className="grid gap-4 border-b border-[#eee8f4] p-6 last:border-b-0 md:grid-cols-[1fr_auto] md:items-center">
      <div className="flex items-center gap-4">
        {glyph}
        <div>
          <h2 className="text-xl font-extrabold text-[#222026]">{title}</h2>
          <p className="mt-1 text-sm font-medium text-[#77727c]">
            {description}
          </p>
        </div>
      </div>
      <div className="flex justify-end">{action}</div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[#eee8f4] bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-extrabold">
          {icon}
          {title}
        </div>
        <ChevronRight className="h-5 w-5 text-[#aaa5ad]" />
      </div>
      <p className="text-sm font-medium leading-6 text-[#77727c]">{body}</p>
    </div>
  );
}
