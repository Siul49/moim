import { SchedulerPreview } from "@/components/moim/reference-ui";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const recentSchedules = await prisma.schedule.findMany({
    where: { creatorId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return <SchedulerPreview schedules={recentSchedules} />;
}
