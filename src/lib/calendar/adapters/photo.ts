/**
 * 사진(스크린샷) → 표준 CalendarEvent 어댑터 — 스텁
 *
 * 후속 이슈(AI 사진 가용시간 추출)에서 구현한다. 본 파일은 어댑터 자리만
 * 잡아 두기 위한 placeholder다. AI 추출 결과의 입력 타입은 후속 PR에서
 * 확정한다(예: `{ slots: { startAt, endAt }[] }`).
 *
 * @see Issue #15 후속 작업
 */

import type { CalendarAdapter } from "../adapter";

export interface PhotoExtractionResult {
  /** 모델이 사진에서 추출한 busy 슬롯 (절대 시각). */
  busy: { startAt: Date; endAt: Date; title?: string }[];
}

export const photoAdapter: CalendarAdapter<PhotoExtractionResult> = {
  source: "photo",
  toCalendarEvents(_raw) {
    throw new Error(
      "photoAdapter.toCalendarEvents: 후속 이슈(AI 사진 추출)에서 구현 예정",
    );
  },
};
