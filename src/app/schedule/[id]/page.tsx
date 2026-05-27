import { ScheduleRoomClient } from "./ScheduleRoomClient";

export default function ScheduleParticipantPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { hostToken?: string };
}) {
  return (
    <ScheduleRoomClient
      scheduleId={params.id}
      hostToken={searchParams.hostToken ?? ""}
    />
  );
}
