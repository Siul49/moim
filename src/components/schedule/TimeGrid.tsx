/**
 * TimeGrid — When2meet 스타일 시간 선택 그리드 (스켈레톤)
 *
 * PRD 3.3의 "시간표에서 가능한 시간 클릭" UI 컴포넌트.
 * 비연동 참여자가 수동으로 가능한 시간을 선택하는 그리드.
 *
 * TODO: UI 구현 후 React Testing Library로 테스트 작성
 */

export default function TimeGrid() {
  return (
    <div
      role="grid"
      aria-label="시간 선택 그리드"
      tabIndex={0}
      className="w-full h-96 border rounded-lg p-4"
    >
      {/* TODO: 시간 그리드 UI 구현 */}
      <h2 className="text-lg font-semibold mb-2">시간표</h2>
      <p className="text-sm text-muted-foreground">
        가능한 시간을 드래그하여 선택하세요.
      </p>
    </div>
  );
}
