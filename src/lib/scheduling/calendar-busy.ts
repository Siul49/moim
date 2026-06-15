/**
 * 절대 시각 캘린더 이벤트 → 요일+정수시 격자의 "바쁜 슬롯 키" 변환
 *
 * 모임 후보 격자는 요일(`DayCode`)과 정시(`hour`)로 이루어진 `${day}-${hour}`
 * 키를 쓴다(예: `MON-10`). 외부 캘린더에서 가져온 이벤트는 절대 시각이므로,
 * 후보 기간 안에서 각 이벤트가 점유하는 정시 칸을 모두 busy로 표시한다.
 *
 * 시간대 처리: `Date`의 `getDay()`/`getHours()`를 사용하므로 이 함수가 실행되는
 * 런타임의 로컬 시간대 기준으로 요일/시간이 계산된다. 후보 격자가 사용자 로컬
 * 시간대(한국 사용자는 KST)로 표시되므로, 변환은 클라이언트(브라우저)에서
 * 수행하는 것을 전제로 한다.
 */

import type { CalendarEvent } from "@/types/calendar-event";
import type { DayCode } from "@/types/schedule";

const JS_DAY_TO_CODE: DayCode[] = [
  "SUN",
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
];

export interface BusySlotWindow {
  /** 후보 시작 시(포함) */
  startHour: number;
  /** 후보 종료 시(미포함) */
  endHour: number;
  /** 후보 요일 제한(미지정 시 모든 요일 허용) */
  days?: DayCode[];
}

/**
 * 이벤트 배열을 후보 격자의 busy 슬롯 키(`${DayCode}-${hour}`) 집합으로 변환한다.
 *
 * - 한 이벤트가 정시 칸에 조금이라도 걸치면 그 칸을 busy로 본다(부분 겹침=점유).
 * - 종일 이벤트(`isAllDay`)는 해당 날짜의 후보 시간 전체를 busy로 만든다.
 * - `startHour`~`endHour`(그리고 `days`) 밖의 칸은 무시한다.
 */
export function eventsToBusySlotKeys(
  events: CalendarEvent[],
  window: BusySlotWindow,
): string[] {
  const { startHour, endHour, days } = window;
  const dayAllowed = (day: DayCode) => !days || days.includes(day);
  const keys = new Set<string>();

  for (const event of events) {
    if (!(event.startAt instanceof Date) || isNaN(event.startAt.getTime())) {
      continue;
    }
    if (!(event.endAt instanceof Date) || isNaN(event.endAt.getTime())) {
      continue;
    }

    if (event.isAllDay) {
      markAllDay(event, keys, window, dayAllowed);
      continue;
    }

    // 시작 시각을 정시로 내린 지점부터 종료 시각 전까지 한 시간씩 순회한다.
    const cursor = new Date(event.startAt);
    cursor.setMinutes(0, 0, 0);
    const endMs = event.endAt.getTime();

    // 비정상적으로 긴 이벤트(또는 데이터 오류)로 인한 무한 루프 방지용 상한.
    let guard = 0;
    while (cursor.getTime() < endMs && guard < 24 * 366) {
      const day = JS_DAY_TO_CODE[cursor.getDay()];
      const hour = cursor.getHours();
      if (hour >= startHour && hour < endHour && dayAllowed(day)) {
        keys.add(`${day}-${hour}`);
      }
      cursor.setTime(cursor.getTime() + 60 * 60 * 1000);
      guard += 1;
    }
  }

  return [...keys];
}

/**
 * 종일 이벤트가 걸치는 각 날짜에 대해 후보 시간 전체를 busy로 표시한다.
 * 종일 이벤트의 `endAt`은 보통 마지막 날 자정(미포함)이므로, 날짜 단위로
 * `startAt`(포함)부터 `endAt`(미포함)까지 순회한다.
 */
function markAllDay(
  event: CalendarEvent,
  keys: Set<string>,
  window: BusySlotWindow,
  dayAllowed: (day: DayCode) => boolean,
): void {
  const { startHour, endHour } = window;
  const day = new Date(event.startAt);
  day.setHours(0, 0, 0, 0);
  const endMs = event.endAt.getTime();

  let guard = 0;
  while (day.getTime() < endMs && guard < 366) {
    const code = JS_DAY_TO_CODE[day.getDay()];
    if (dayAllowed(code)) {
      for (let hour = startHour; hour < endHour; hour++) {
        keys.add(`${code}-${hour}`);
      }
    }
    day.setDate(day.getDate() + 1);
    guard += 1;
  }
}
