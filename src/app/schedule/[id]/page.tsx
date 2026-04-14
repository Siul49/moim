/**
 * 스케줄링 참여 페이지 (스켈레톤)
 *
 * PRD 3.2~3.3 — 참여자가 공유 링크를 통해 진입하는 페이지.
 * [id]는 동적 라우트로, 각 스케줄링 세션을 구분한다.
 *
 * 경로 예: /schedule/abc123 → id = 'abc123'
 *
 * 이 페이지에서 참여자가:
 * - 캘린더 연동 (플로우 A)
 * - 수동 입력 (플로우 B)
 * 중 하나를 선택한다.
 */

export default function ScheduleParticipantPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main>
      <h1>일정 참여</h1>
      <p>세션 ID: {params.id}</p>
      {/* TODO: 캘린더 연동 / 수동 입력 선택 UI */}
    </main>
  );
}
