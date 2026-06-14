import { ScheduleRoomClient } from "./ScheduleRoomClient";

export default async function ScheduleParticipantPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ hostToken?: string; participate?: string }>;
}) {
  const { id } = await params;
  const { hostToken, participate } = await searchParams;

  return (
    <ScheduleRoomClient
      scheduleId={id}
      hostToken={hostToken ?? ""}
      forceParticipant={participate === "1"}
    />
  );
}
