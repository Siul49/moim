import { ScheduleRoomClient } from "./ScheduleRoomClient";

export default async function ScheduleParticipantPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hostToken?: string }>;
}) {
  const { id } = await params;
  const { hostToken } = await searchParams;

  return <ScheduleRoomClient scheduleId={id} hostToken={hostToken ?? ""} />;
}
