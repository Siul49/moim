import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile name or email for display
  const displayName =
    user.user_metadata?.nickname || user.email?.split("@")[0] || "사용자";

  return (
    <div className="min-h-screen bg-brand-bg-light flex flex-col md:flex-row text-brand-text-primary">
      {/* Sidebar / Mobile Nav */}
      <aside className="w-full md:w-64 border-b md:border-r border-brand-border-muted bg-white flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="h-16 px-6 border-b border-brand-border-muted flex items-center justify-between">
            <Link
              href="/dashboard"
              className="text-2xl font-black tracking-normal text-brand-purple no-underline"
            >
              MOIM
            </Link>
            <span className="md:hidden text-xs font-bold text-brand-purple bg-brand-purple-ring px-2.5 py-1 rounded-full border border-brand-border-muted">
              Member
            </span>
          </div>

          {/* Nav Links */}
          <nav className="p-4 space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-brand-text-secondary hover:text-brand-purple hover:bg-brand-bg-light transition-all no-underline"
            >
              <LayoutDashboard className="h-5 w-5" />
              대시보드 홈
            </Link>
            <Link
              href="/dashboard/meetings"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-brand-text-secondary hover:text-brand-purple hover:bg-brand-bg-light transition-all no-underline"
            >
              <CalendarDays className="h-5 w-5" />내 모임 관리
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-brand-text-secondary hover:text-brand-purple hover:bg-brand-bg-light transition-all no-underline"
            >
              <Settings className="h-5 w-5" />
              연동 및 설정
            </Link>
          </nav>
        </div>

        {/* User profile card & Logout */}
        <div className="p-4 border-t border-brand-border-muted bg-brand-bg-light/30">
          <div className="flex items-center gap-3 px-2 py-1.5 mb-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-purple-ring text-brand-purple shadow-sm border border-brand-border-muted">
              <User className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-extrabold text-xs text-brand-text-primary truncate">
                {displayName}
              </p>
              <p className="text-[10px] font-semibold text-brand-text-muted truncate">
                {user.email}
              </p>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-100 hover:border-red-200 bg-white hover:bg-red-50 text-xs font-bold text-red-500 hover:text-red-600 transition-all cursor-pointer shadow-sm"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-brand-border-muted bg-white px-6 hidden md:flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-brand-purple animate-pulse" />
            <span className="text-xs font-extrabold text-brand-text-muted">
              마이 스페이스 대시보드
            </span>
          </div>
          <Link
            href="/schedule/create"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-brand-purple px-5 text-xs font-bold text-white hover:bg-brand-purple-hover hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md no-underline"
          >
            새 모임 개설하기
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
