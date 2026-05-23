"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const supabase = createClient();

  const handleLogin = async (provider: "google" | "kakao") => {
    setIsLoading(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error("로그인 에러:", err);
      setIsLoading(null);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4">
      {/* 백그라운드 오로라 이펙트 */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-[40%] -left-[20%] h-[80%] w-[60%] rounded-full bg-violet-600/20 blur-[120px] filter animate-pulse"
          style={{ animationDuration: "10s" }}
        />
        <div
          className="absolute -bottom-[40%] -right-[20%] h-[80%] w-[60%] rounded-full bg-rose-600/10 blur-[120px] filter animate-pulse"
          style={{ animationDuration: "7s" }}
        />
      </div>

      {/* 로그인 카드 */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl transition-all duration-300">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 font-bold text-2xl shadow-lg shadow-violet-500/5">
            M
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-4">
            MOIM 시작하기
          </h1>
          <p className="text-sm text-slate-400">
            시간 조율을 더 스마트하고 완벽하게
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {/* 카카오 로그인 버튼 */}
          <button
            onClick={() => handleLogin("kakao")}
            disabled={isLoading !== null}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#FEE500] px-4 py-3 text-sm font-semibold text-[#191919] hover:bg-[#FEE500]/90 active:scale-[0.98] transition-all duration-150 shadow-md shadow-yellow-500/5 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading === "kakao" ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#191919] border-t-transparent" />
            ) : (
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.707 4.8 4.27 6.054-.188.702-.68 2.531-.777 2.87-.12.43.148.423.31.314.127-.085 2.029-1.38 2.846-1.936.438.12.896.183 1.351.183 4.97 0 9-3.186 9-7.115S16.97 3 12 3z" />
              </svg>
            )}
            카카오로 3초 만에 시작하기
          </button>

          {/* 구글 로그인 버튼 */}
          <button
            onClick={() => handleLogin("google")}
            disabled={isLoading !== null}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 px-4 py-3 text-sm font-semibold text-white active:scale-[0.98] transition-all duration-150 shadow-md disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading === "google" ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.107C18.28 1.945 15.5 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.985 0-.74-.08-1.3-.176-1.857H12.24z"
                />
              </svg>
            )}
            Google 계정으로 계속하기
          </button>
        </div>

        <div className="mt-8 text-center text-xs text-slate-500">
          로그인 시 MOIM의{" "}
          <a href="#" className="underline hover:text-slate-400">
            서비스 이용약관
          </a>
          및{" "}
          <a href="#" className="underline hover:text-slate-400">
            개인정보 처리방침
          </a>
          에 동의하게 됩니다.
        </div>
      </div>
    </div>
  );
}
