"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle,
  Clock,
  Globe,
  Save,
  User,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Supabase의 PostgrestError는 Error 인스턴스가 아니라 { message, ... } 객체라
 * `instanceof Error`만으로는 실제 메시지가 가려진다. 메시지 문자열을 폭넓게 추출한다.
 */
function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string" &&
    (err as { message: string }).message
  ) {
    return (err as { message: string }).message;
  }
  return fallback;
}

export default function DashboardSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [startHour, setStartHour] = useState("09");
  const [endHour, setEndHour] = useState("18");
  const [timezone, setTimezone] = useState("Asia/Seoul");
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  const [hasGoogle, setHasGoogle] = useState(false);
  const [hasICloud, setHasICloud] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [icloudAppleId, setIcloudAppleId] = useState("");

  // iCloud modal states
  const [showICloudModal, setShowICloudModal] = useState(false);
  const [appleIdInput, setAppleIdInput] = useState("");
  const [appPasswordInput, setAppPasswordInput] = useState("");
  const [icloudError, setIcloudError] = useState("");
  const [icloudConnecting, setIcloudConnecting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setNickname(profile.nickname || user.user_metadata?.nickname || "");
        setPhoneNumber(profile.phone_number || "");
        setStartHour(profile.preferred_start_hour || "09");
        setEndHour(profile.preferred_end_hour || "18");
        setTimezone(profile.preferred_timezone || "Asia/Seoul");
      } else {
        setNickname(user.user_metadata?.nickname || "");
      }

      // 캘린더 연동 상태는 쿠키 기반(/api/calendar/status)이 단일 소스다.
      // (OAuth 콜백/iCloud 연동은 쿠키에 저장하며, google_connections /
      //  icloud_connections 테이블은 연동 흐름에서 채워지지 않아 항상 미연동으로 보였음)
      // 모임 만들기 화면(/calendar/connect)과 동일한 소스로 통일한다.
      try {
        const statusRes = await fetch("/api/calendar/status");
        if (statusRes.ok) {
          const status = await statusRes.json();
          setHasGoogle(!!status.googleConnected);
          setGoogleEmail(status.googleEmail || "");
          setHasICloud(!!status.icloudConnected);
          setIcloudAppleId(status.icloudAppleId || "");
        }
      } catch (err) {
        console.error("[settings] 캘린더 연동 상태 조회 실패:", err);
      }

      setLoading(false);
    }

    loadProfile();
  }, [supabase]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (updating) return;

    setUpdating(true);
    setMessage("");
    setMessageIsError(false);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("사용자 정보를 찾을 수 없습니다.");

      // 선호 시작/종료 시간 순서 검증 (역전된 값 저장 방지)
      const start = Number(startHour);
      const end = Number(endHour);
      if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
        throw new Error("선호 시작 시간은 종료 시간보다 이전이어야 합니다.");
      }

      // 1. Update profiles table
      // 가입 트리거(handle_new_user)가 프로필 행을 항상 생성하므로 update를 쓴다.
      // (profiles에는 update RLS 정책만 있고 insert 정책이 없어 upsert는 막힐 수 있음)
      // .select().single()으로 갱신된 행을 강제 반환 → 행이 없거나 RLS로 막히면
      // 0건이 'success'로 처리되지 않고 에러(PGRST116)로 드러난다.
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          email,
          nickname,
          phone_number: phoneNumber,
          preferred_start_hour: startHour,
          preferred_end_hour: endHour,
          preferred_timezone: timezone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select("id")
        .single();

      if (profileError) throw profileError;

      // 2. Update user metadata nickname
      const { error: userError } = await supabase.auth.updateUser({
        data: { nickname },
      });

      if (userError) throw userError;

      setMessage("설정이 성공적으로 저장되었습니다. ✨");
      setMessageIsError(false);
    } catch (err) {
      console.error(err);
      setMessage(getErrorMessage(err, "업데이트 중 오류가 발생했습니다."));
      setMessageIsError(true);
    } finally {
      setUpdating(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!confirm("Google Calendar 연동을 해제하시겠습니까?")) return;
    try {
      const response = await fetch("/api/google/disconnect", {
        method: "POST",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "해제 실패");
      setHasGoogle(false);
      setGoogleEmail("");
      setMessage("Google Calendar 연동이 해제되었습니다. 🔌");
      setMessageIsError(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "오류가 발생했습니다.");
    }
  };

  const handleDisconnectICloud = async () => {
    if (!confirm("iCloud Calendar 연동을 해제하시겠습니까?")) return;
    try {
      const response = await fetch("/api/icloud/disconnect", {
        method: "POST",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "해제 실패");
      setHasICloud(false);
      setIcloudAppleId("");
      setMessage("iCloud Calendar 연동이 해제되었습니다. 🔌");
      setMessageIsError(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "오류가 발생했습니다.");
    }
  };

  const handleConnectICloud = async (e: React.FormEvent) => {
    e.preventDefault();
    setIcloudError("");
    setIcloudConnecting(true);
    try {
      const response = await fetch("/api/icloud/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appleId: appleIdInput,
          appPassword: appPasswordInput,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "iCloud 연동에 실패했습니다.");
      }
      setHasICloud(true);
      setIcloudAppleId(appleIdInput);
      setShowICloudModal(false);
      setAppleIdInput("");
      setAppPasswordInput("");
      setMessage("iCloud Calendar 연동에 성공했습니다! 🎉");
      setMessageIsError(false);
    } catch (err) {
      setIcloudError(
        err instanceof Error ? err.message : "연동 중 오류가 발생했습니다.",
      );
    } finally {
      setIcloudConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <span className="h-6 w-6 rounded-full border-2 border-brand-purple border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-text-primary">
          연동 및 설정
        </h1>
        <p className="text-xs text-brand-text-muted mt-1">
          개인 프로필 정보, 외부 캘린더 연동 및 기본 약속 조건을 관리합니다.
          (시안 07, 08, 10)
        </p>
      </div>

      {message && (
        <div
          role="alert"
          className={`rounded-xl p-4 text-xs font-bold ${
            messageIsError
              ? "bg-red-50 text-red-600 border border-red-100"
              : "bg-green-50 text-green-600 border border-green-100"
          }`}
        >
          {message}
        </div>
      )}

      {/* Profile Section */}
      <form onSubmit={handleUpdateProfile} className="space-y-6">
        {/* Profile Card */}
        <div className="rounded-[1.5rem] border border-brand-border-muted bg-white p-6 shadow-premium space-y-4">
          <h2 className="text-sm font-extrabold text-brand-text-primary flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-brand-purple" />내 프로필 설정 (시안
            10)
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-xs font-bold text-brand-text-secondary">
              이메일 주소 (수정 불가)
              <input
                type="email"
                value={email}
                disabled
                className="moim-input bg-brand-bg-light/50 text-brand-text-muted text-sm cursor-not-allowed"
              />
            </label>

            <label className="grid gap-2 text-xs font-bold text-brand-text-secondary">
              닉네임
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
                className="moim-input text-sm font-normal"
                required
              />
            </label>

            <label className="grid gap-2 text-xs font-bold text-brand-text-secondary">
              전화번호
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="010-1234-5678"
                className="moim-input text-sm font-normal"
              />
            </label>
          </div>
        </div>

        {/* Preferences Card */}
        <div className="rounded-[1.5rem] border border-brand-border-muted bg-white p-6 shadow-premium space-y-4">
          <h2 className="text-sm font-extrabold text-brand-text-primary flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-brand-purple" />
            기본 일정 선호 조건 설정 (시안 08)
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2 text-xs font-bold text-brand-text-secondary">
              선호 시작 시간
              <select
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
                className="moim-select text-sm font-normal"
              >
                {Array.from({ length: 24 }, (_, i) =>
                  String(i).padStart(2, "0"),
                ).map((hr) => (
                  <option key={hr} value={hr}>
                    {hr}:00
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-xs font-bold text-brand-text-secondary">
              선호 종료 시간
              <select
                value={endHour}
                onChange={(e) => setEndHour(e.target.value)}
                className="moim-select text-sm font-normal"
              >
                {Array.from({ length: 24 }, (_, i) =>
                  String(i).padStart(2, "0"),
                ).map((hr) => (
                  <option key={hr} value={hr}>
                    {hr}:00
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-xs font-bold text-brand-text-secondary">
              기본 타임존
              <div className="relative">
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="moim-select w-full text-sm font-normal pl-8"
                >
                  <option value="Asia/Seoul">Asia/Seoul (KST)</option>
                  <option value="UTC">Coordinated Universal Time (UTC)</option>
                </select>
                <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-muted pointer-events-none" />
              </div>
            </label>
          </div>
        </div>

        {/* Integration Card */}
        <div className="rounded-[1.5rem] border border-brand-border-muted bg-white p-6 shadow-premium space-y-4">
          <h2 className="text-sm font-extrabold text-brand-text-primary flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-brand-purple" />
            캘린더 연동 관리 (시안 07)
          </h2>

          <div className="divide-y divide-brand-border-muted">
            {/* Google Calendar */}
            <div className="flex items-center justify-between py-3 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-xs">
                  G
                </span>
                <div>
                  <p className="text-xs font-extrabold text-brand-text-primary">
                    Google Calendar
                  </p>
                  <p className="text-[10px] text-brand-text-muted">
                    {hasGoogle
                      ? googleEmail
                        ? `${googleEmail} · 연동 완료`
                        : "연동 완료"
                      : "내 캘린더 일정 실시간 차단용 연동"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasGoogle ? (
                  <>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                      <CheckCircle className="h-3.5 w-3.5" /> 연동됨
                    </span>
                    <button
                      type="button"
                      onClick={handleDisconnectGoogle}
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-[10px] font-bold text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                    >
                      해제하기
                    </button>
                  </>
                ) : (
                  <a
                    href="/api/google/auth"
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-brand-border-gray bg-white px-3 text-[10px] font-bold text-brand-text-primary hover:border-brand-purple hover:bg-brand-bg-light transition-all no-underline"
                  >
                    연동하기
                  </a>
                )}
              </div>
            </div>

            {/* Apple iCloud Calendar */}
            <div className="flex items-center justify-between py-3 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-800 font-bold text-xs">
                  A
                </span>
                <div>
                  <p className="text-xs font-extrabold text-brand-text-primary">
                    Apple iCloud Calendar
                  </p>
                  <p className="text-[10px] text-brand-text-muted">
                    {hasICloud
                      ? `${icloudAppleId} · 연동 완료`
                      : "iCloud 스케줄 가져오기"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasICloud ? (
                  <>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                      <CheckCircle className="h-3.5 w-3.5" /> 연동됨
                    </span>
                    <button
                      type="button"
                      onClick={handleDisconnectICloud}
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-[10px] font-bold text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                    >
                      해제하기
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowICloudModal(true)}
                    className="inline-flex h-8 items-center justify-center rounded-lg border border-brand-border-gray bg-white px-3 text-[10px] font-bold text-brand-text-primary hover:border-brand-purple hover:bg-brand-bg-light transition-all cursor-pointer"
                  >
                    연동하기
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updating}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-purple px-6 text-sm font-bold text-white hover:bg-brand-purple-hover hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {updating ? "저장 중" : "설정 저장하기"}
          </button>
        </div>
      </form>

      {/* iCloud 연동 모달 */}
      {showICloudModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-[2.5rem] border border-brand-border-muted bg-white p-8 shadow-premium-lg relative animate-scaleIn">
            <button
              type="button"
              onClick={() => {
                setShowICloudModal(false);
                setIcloudError("");
              }}
              className="absolute right-6 top-6 rounded-full p-1.5 text-brand-text-light hover:bg-brand-bg-muted hover:text-brand-text-primary transition-colors"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-bg-muted text-2xl text-brand-purple shadow-inner mb-6">
              ☁️
            </span>
            <h3 className="text-xl font-extrabold text-brand-text-primary text-center">
              iCloud 캘린더 연동
            </h3>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-brand-text-muted text-center max-w-sm mx-auto">
              Apple ID와 앱 전용 암호를 입력하여 iCloud 일정을 MOIM에
              동기화하세요.
            </p>
            <div className="mt-4 rounded-xl bg-brand-bg-light p-3 text-[11px] font-semibold text-brand-purple border border-brand-border-muted leading-relaxed">
              ⚠️ **중요**: Apple ID의 실제 비밀번호가 아닌, Apple 계정 관리
              페이지에서 생성한 **앱 전용 암호(App-Specific Password)**를
              입력해야 연동할 수 있습니다.
            </div>

            <form onSubmit={handleConnectICloud} className="mt-6 space-y-4">
              <label className="grid gap-2 text-xs font-bold text-brand-text-secondary">
                Apple ID (이메일)
                <input
                  type="email"
                  value={appleIdInput}
                  onChange={(e) => setAppleIdInput(e.target.value)}
                  placeholder="example@icloud.com"
                  className="moim-input text-sm font-normal"
                  required
                />
              </label>

              <label className="grid gap-2 text-xs font-bold text-brand-text-secondary">
                앱 전용 암호 (xxxx-xxxx-xxxx-xxxx)
                <input
                  type="text"
                  value={appPasswordInput}
                  onChange={(e) => setAppPasswordInput(e.target.value)}
                  placeholder="abcd-efgh-ijkl-mnop"
                  className="moim-input text-sm font-normal"
                  required
                />
              </label>

              {icloudError && (
                <p
                  role="alert"
                  className="text-xs text-destructive font-semibold"
                >
                  {icloudError}
                </p>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowICloudModal(false);
                    setIcloudError("");
                  }}
                  className="flex-1 h-11 rounded-xl border border-brand-border-muted text-xs font-bold text-brand-text-secondary hover:bg-brand-bg-light transition-all cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={icloudConnecting}
                  className="flex-1 h-11 rounded-xl bg-brand-purple text-xs font-bold text-white shadow-md hover:bg-brand-purple-hover transition-all disabled:opacity-50 cursor-pointer"
                >
                  {icloudConnecting ? "연결 중..." : "연동 완료"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
