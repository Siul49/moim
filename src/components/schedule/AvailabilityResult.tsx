/**
 * AvailabilityResult — 공통 가용시간 결과 표시 (스켈레톤)
 *
 * PRD 5.2의 "공통 가능 시간: 현재까지 완료한 사람 기준 실시간 업데이트" 컴포넌트.
 *
 * TODO: UI 구현 후 React Testing Library로 테스트 작성
 */

export default function AvailabilityResult() {
  return (
    <section
      aria-labelledby="availability-title"
      className="p-4 bg-muted/50 rounded-lg"
    >
      <h2 id="availability-title" className="text-lg font-semibold mb-2">
        공통 가능 시간
      </h2>
      <div aria-live="assertive">
        {/* TODO: 가용시간 결과 UI 구현 */}
        <p className="text-sm text-muted-foreground">
          모든 참여자의 데이터를 취합하여 결과를 보여줍니다.
        </p>
      </div>
    </section>
  );
}
