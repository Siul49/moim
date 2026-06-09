"use client";

import { FormEvent, useState, useEffect } from "react";
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

  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [icloudConnected, setIcloudConnected] = useState(false);
  const [icloudConnectedId, setIcloudConnectedId] = useState("");

  async function loadStatus() {
    try {
      const response = await fetch("/api/calendar/status");
      if (response.ok) {
        const data = await response.json();
        setGoogleConnected(data.googleConnected);
        setGoogleEmail(data.googleEmail ?? "");
        setIcloudConnected(data.icloudConnected);
        setIcloudConnectedId(data.icloudAppleId ?? "");
      }
    } catch (err) {
      console.error("연동 상태 조회 실패:", err);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

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
    const maxSize = 100 * 1024;
    if (!isIcs) {
      setMessage("ICS 형식 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > maxSize) {
      setMessage("파일 크기는 100KB 이하여야 합니다.");
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
      await loadStatus(); // 상태 새로고침
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : "요청에 실패했습니다.",
      );
    } finally {
      setIsLoading("");
    }
  }

  async function disconnectGoogle() {
    setMessage("");
    setIsLoading("google-disconnect");
    try {
      const response = await fetch("/api/google/disconnect", {
        method: "POST",
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error ?? "연동 해제에 실패했습니다.");
      }
      setGoogleConnected(false);
      setGoogleEmail("");
      setMessage(
        "Google 캘린더 연동이 해제되고 모든 데이터가 안전하게 파기되었습니다.",
      );
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : "요청에 실패했습니다.",
      );
    } finally {
      setIsLoading("");
    }
  }

  async function disconnectIcloud() {
    setMessage("");
    setIsLoading("icloud-disconnect");
    try {
      const response = await fetch("/api/icloud/disconnect", {
        method: "POST",
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error ?? "연동 해제에 실패했습니다.");
      }
      setIcloudConnected(false);
      setIcloudConnectedId("");
      setMessage(
        "iCloud 캘린더 연동이 해제되고 모든 데이터가 안전하게 파기되었습니다.",
      );
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : "요청에 실패했습니다.",
      );
    } finally {
      setIsLoading("");
    }
  }

  // 연동(또는 시간표 변환)을 하나라도 마쳤는지 여부.
  // 지금은 건너뛰기가 가능한 '선택' 단계라 진행 버튼은 항상 활성화한다.
  // 추후 '필수'로 전환하려면 아래 하단 버튼 영역에서 이 값으로 진행을 막으면 된다.
  const hasAnyConnection =
    googleConnected || icloudConnected || slots.length > 0;

  return (
    <MoimShell className="bg-[#fcfaff]">
      <MoimTopBar activeHref="/calendar/connect" help />

      <section className="mx-auto max-w-[920px] px-6 pb-24 pt-14">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-normal text-[#222026] sm:text-5xl bg-clip-text text-transparent bg-gradient-to-br from-[#222026] to-[#5f5865]">
            캘린더 연동
          </h1>
          <p className="mt-5 text-lg font-medium leading-8 text-[#6f6a73]">
            흩어진 일정을 하나로 모아 모임 가능한 시간만 추려냅니다.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-[#ded4f7] bg-gradient-to-br from-[#fcfaff] via-[#f5efff] to-white p-6 text-sm font-semibold text-[#6252ac] flex items-start gap-4 shadow-sm">
          <span className="text-2xl mt-0.5">🛡️</span>
          <div>
            <p className="font-extrabold text-[#6252ac] text-sm sm:text-base">
              MOIM 개인정보 보호 선언
            </p>
            <p className="mt-1 text-xs text-[#7c749b] font-semibold leading-relaxed">
              우리는 일정의 세부 내용(제목, 장소, 참석자 등)을 서버에 절대
              저장하지 않으며, 오직 시간 교집합 판단에 필요한 빈 시간 정보만
              분석합니다. 연동 정보는 언제든지 아래에서 흔적 없이 안전하게 영구
              파기하실 수 있습니다.
            </p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-[#eee8f4] bg-white shadow-premium hover:shadow-premium-lg transition-all duration-300">
          <IntegrationRow
            glyph={<ProviderGlyph type="google" />}
            title="Google 캘린더"
            description="업무와 개인 일정을 실시간으로 불러옵니다."
            action={
              googleConnected ? (
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                  <span className="text-sm font-semibold text-[#6252ac] bg-[#f2eefc] px-3 py-1.5 rounded-lg border border-[#e5dfeb]">
                    {googleEmail} (연동됨)
                  </span>
                  <PurpleButton
                    type="button"
                    onClick={disconnectGoogle}
                    className="h-11 px-5 text-sm bg-[#e11d48] hover:bg-[#be123c] shadow-none"
                    disabled={isLoading === "google-disconnect"}
                  >
                    {isLoading === "google-disconnect"
                      ? "해제 중"
                      : "연동 해제"}
                  </PurpleButton>
                </div>
              ) : (
                <a
                  href="/api/google/auth"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-[#8f7bd6] px-5 text-sm font-bold text-white hover:bg-[#7d68c9] transition-all hover:scale-[1.02] shadow-sm"
                >
                  연동하기
                </a>
              )
            }
          />

          <IntegrationRow
            glyph={<ProviderGlyph type="apple" />}
            title="Apple 캘린더"
            description="Apple ID와 앱 전용 암호로 iCloud 일정을 확인합니다."
            action={
              icloudConnected ? (
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                  <span className="text-sm font-semibold text-[#6252ac] bg-[#f2eefc] px-3 py-1.5 rounded-lg border border-[#e5dfeb]">
                    {icloudConnectedId} (연동됨)
                  </span>
                  <PurpleButton
                    type="button"
                    onClick={disconnectIcloud}
                    className="h-11 px-5 text-sm bg-[#e11d48] hover:bg-[#be123c] shadow-none"
                    disabled={isLoading === "icloud-disconnect"}
                  >
                    {isLoading === "icloud-disconnect"
                      ? "해제 중"
                      : "연동 해제"}
                  </PurpleButton>
                </div>
              ) : (
                <div className="flex flex-col gap-2 w-full md:w-[420px]">
                  <form
                    onSubmit={submitIcloud}
                    className="grid w-full gap-2 sm:grid-cols-[1fr_1fr_auto]"
                  >
                    <input
                      value={icloudAppleId}
                      onChange={(event) => setIcloudAppleId(event.target.value)}
                      placeholder="user@icloud.com"
                      className="h-11 rounded-xl border border-[#e5dfeb] px-3 text-sm outline-none focus:border-[#8f7bd6] focus:ring-2 focus:ring-[#ece7fb] transition-all"
                      type="email"
                      required
                    />
                    <input
                      value={icloudPassword}
                      onChange={(event) =>
                        setIcloudPassword(event.target.value)
                      }
                      placeholder="앱 전용 암호"
                      className="h-11 rounded-xl border border-[#e5dfeb] px-3 text-sm outline-none focus:border-[#8f7bd6] focus:ring-2 focus:ring-[#ece7fb] transition-all"
                      type="password"
                      required
                    />
                    <PurpleButton
                      type="submit"
                      className="h-11 px-5 text-sm shadow-sm"
                      disabled={isLoading === "icloud"}
                    >
                      {isLoading === "icloud" ? "확인 중" : "확인"}
                    </PurpleButton>
                  </form>
                  <p className="text-[11px] text-[#77727c] font-semibold leading-relaxed bg-[#fbf7ff] p-2.5 rounded-xl border border-[#eee8f4]">
                    ℹ️ <b>iCloud 연동 안전 가이드:</b> Apple 계정 마스터 암호가
                    아닌, Apple ID 관리 페이지에서 발급받은{" "}
                    <b>앱 전용 암호(xxxx-xxxx-xxxx-xxxx)</b>를 입력하여 보안을
                    유지합니다. 입력 정보는 AES-256-GCM 알고리즘으로 안전하게
                    암호화되어 관리됩니다.
                  </p>
                </div>
              )
            }
          />

          <IntegrationRow
            glyph={<ProviderGlyph type="everytime" />}
            title="Everytime"
            description="공유 URL을 가능한 시간 블록으로 변환합니다."
            action={
              <form
                onSubmit={submitEverytimeUrl}
                className="flex w-full gap-2 md:w-[420px]"
              >
                <input
                  value={everytimeUrl}
                  onChange={(event) => setEverytimeUrl(event.target.value)}
                  placeholder="https://everytime.kr/@..."
                  className="h-11 min-w-0 flex-1 rounded-xl border border-[#e5dfeb] px-3 text-sm outline-none focus:border-[#8f7bd6] focus:ring-2 focus:ring-[#ece7fb] transition-all"
                  required
                />
                <PurpleButton
                  type="submit"
                  className="h-11 px-5 text-sm shadow-sm"
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
              <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#e5dfeb] bg-white px-5 text-sm font-bold text-[#6252ac] hover:bg-[#fbf7ff] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm">
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

        {/* 다음 단계: 모임 만들기로 진행 (현재는 건너뛰기 가능한 선택 단계) */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <a
            href="/schedule/create"
            className="inline-flex h-12 w-full max-w-[420px] items-center justify-center rounded-xl bg-[#8f7bd6] px-7 text-base font-bold text-white shadow-[0_10px_18px_rgba(98,82,172,0.22)] transition-all hover:scale-[1.01] hover:bg-[#7d68c9]"
          >
            모임 만들러 가기
          </a>
          {!hasAnyConnection ? (
            <a
              href="/schedule/create"
              className="text-sm font-semibold text-[#8b8593] underline-offset-4 transition-colors hover:text-[#6252ac] hover:underline"
            >
              나중에 연동할게요 (건너뛰기)
            </a>
          ) : null}
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
      <div className="w-full flex justify-end md:w-auto">{action}</div>
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
