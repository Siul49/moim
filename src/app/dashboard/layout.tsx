import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MoimTopBar, MoimShell } from "@/components/moim/reference-ui";

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

  return (
    <MoimShell className="bg-brand-bg-light min-h-screen">
      <MoimTopBar activeHref="/" />
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-16">
        {children}
      </div>
    </MoimShell>
  );
}
