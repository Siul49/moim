/**
 * .ics 파일 파서 (스켈레톤)
 *
 * PRD 4.5 — .ics는 캘린더 앱에서 내보내기한 표준 파일 형식.
 * 네이버/다음 캘린더 등 OAuth 미지원 캘린더에서 일정을 가져올 때 사용.
 *
 * TODO: TDD로 구현 예정
 * 1. .ics 파일 내용을 파싱하여 VEVENT 블록 추출
 * 2. DTSTART/DTEND를 TimeSlot으로 변환
 * 3. 반복 이벤트(RRULE) 처리
 */

import type { TimeSlot } from "@/types/schedule";

/**
 * .ics 파일 텍스트를 파싱하여 TimeSlot 배열로 변환한다.
 *
 * @param icsContent - .ics 파일의 텍스트 내용
 * @returns 파싱된 TimeSlot 배열 (막혀있는 시간)
 */
export function parseIcsToSlots(_icsContent: string): TimeSlot[] {
  // TODO: TDD — 테스트 먼저 작성 후 구현
  throw new Error("Not implemented yet");
}
