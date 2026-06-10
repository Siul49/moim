"use client";

import { useEffect, useState } from "react";
import { Calendar, CheckCircle, Clock, Globe, Save, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
      } else {
        setNickname(user.user_metadata?.nickname || "");
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

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("사용자 정보를 찾을 수 없습니다.");

      // 1. Update profiles table
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        email,
        nickname,
        phone_number: phoneNumber,
        updated_at: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      // 2. Update user metadata nickname
      const { error: userError } = await supabase.auth.updateUser({
        data: { nickname },
      });

      if (userError) throw userError;

      setMessage("설정이 성공적으로 저장되었습니다. ✨");
    } catch (err) {
      console.error(err);
      setMessage(
        err instanceof Error ? err.message : "업데이트 중 오류가 발생했습니다.",
      );
    } finally {
      setUpdating(false);
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
            message.includes("오류")
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
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-xs">
                  G
                </span>
                <div>
                  <p className="text-xs font-extrabold text-brand-text-primary">
                    Google Calendar
                  </p>
                  <p className="text-[10px] text-brand-text-muted">
                    내 캘린더 일정 실시간 차단용 연동
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <CheckCircle className="h-3.5 w-3.5" /> 연동됨
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-800 font-bold text-xs">
                  A
                </span>
                <div>
                  <p className="text-xs font-extrabold text-brand-text-primary">
                    Apple iCloud Calendar
                  </p>
                  <p className="text-[10px] text-brand-text-muted">
                    iCloud 스케줄 가져오기
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => alert("애플 iCloud 연동은 준비 중입니다.")}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-brand-border-gray bg-white px-3 text-[10px] font-bold text-brand-text-primary hover:border-brand-purple hover:bg-brand-bg-light transition-all"
              >
                연동하기
              </button>
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
    </div>
  );
}
