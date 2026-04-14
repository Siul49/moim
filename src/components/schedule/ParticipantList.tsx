/**
 * ParticipantList — 참여자 현황 목록 (스켈레톤)
 *
 * PRD 5.2의 "참여자 목록: 각 참여자별 연동 상태 (완료/대기 중)" 컴포넌트.
 *
 * TODO: UI 구현 후 React Testing Library로 테스트 작성
 */

export default function ParticipantList() {
  return (
    <section aria-label="참여자 현황" className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-4">참여자 목록</h2>
      <ul aria-live="polite" className="space-y-2">
        {/* TODO: 참여자 목록 UI 구현 */}
        <li className="text-sm text-muted-foreground">
          참여자를 불러오는 중...
        </li>
      </ul>
    </section>
  );
}
