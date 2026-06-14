import { ScheduleItem } from "@/types/schedule";
import { SchedulerPreview } from "@/components/moim/reference-ui";

export default function TestLayoutPage() {
  // 테스트용 긴 텍스트가 포함된 가짜 모임 데이터
  const mockSchedules: ScheduleItem[] = [
    {
      id: "1",
      title:
        "이제는 더 이상 물러날 곳이 없! 아아아아아아아아주 긴 텍스트입니다",
      description: "",
      status: "pending",
      durationMinutes: 60,
      candidateStartHour: 9,
      candidateEndHour: 18,
      candidateDays: "2026-06-15",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      title: "짧은 모임",
      description: "",
      status: "confirmed",
      durationMinutes: 60,
      candidateStartHour: 9,
      candidateEndHour: 18,
      candidateDays: "2026-06-16",
      confirmedSlot: "2026-06-16T14:00:00Z",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  return (
    <div className="p-10 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">레이아웃 테스트 페이지</h1>
      <div className="max-w-6xl mx-auto">
        <SchedulerPreview schedules={mockSchedules} />
      </div>
    </div>
  );
}
