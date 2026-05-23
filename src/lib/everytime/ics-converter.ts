import { parseIcsToEvents } from "@/lib/ics/parser";
import type {
  EverytimeLectureTime,
  EverytimeTimetable,
} from "@/types/everytime";

// ============================================================
// 에브리타임 ICS → EverytimeTimetable 변환기
//
// 에브리타임 앱의 "시간표 내보내기(ICS)"로 받은 파일을 파싱한다.
// 각 VEVENT의 DTSTART/DTEND에서 요일·시간을 추출하고,
// 같은 과목명의 여러 시간대(월/수, 화/목 등)를 하나로 병합한다.
// ============================================================

// 에브리타임 ICS는 Asia/Seoul(UTC+9) 기준으로 작성됨
const KST_OFFSET_MS = 9 * 60 * 60_000;

/**
 * JavaScript Date.getUTCDay() 기준(0=일) → 에브리타임 day(0=월) 변환
 * (jsDay + 6) % 7 : 일=6, 월=0, 화=1, 수=2, 목=3, 금=4, 토=5
 */
function toMondayBasedDay(jsDay: number): EverytimeLectureTime["day"] {
  return ((jsDay + 6) % 7) as EverytimeLectureTime["day"];
}

/**
 * 에브리타임 ICS 텍스트를 EverytimeTimetable로 변환한다.
 *
 * - 종일 이벤트는 무시한다 (수업 시간은 항상 시작/종료 시각이 있다).
 * - 같은 과목명끼리 times 배열로 합산한다.
 * - (과목명, 요일, 시작분) 기준으로 중복을 제거한다.
 *   (RRULE이 있는 경우 단일 VEVENT이므로 중복이 없고,
 *    RRULE 없이 매주 개별 VEVENT로 내보내는 경우 중복 제거가 필요하다.)
 */
export function parseTimetableFromIcs(icsText: string): EverytimeTimetable {
  const events = parseIcsToEvents(icsText);

  const lectureMap = new Map<string, Map<string, EverytimeLectureTime>>();

  for (const event of events) {
    if (event.isAllDay) continue;

    const startKst = new Date(event.startAt.getTime() + KST_OFFSET_MS);
    const endKst = new Date(event.endAt.getTime() + KST_OFFSET_MS);

    const day = toMondayBasedDay(startKst.getUTCDay());
    const startMinute = startKst.getUTCHours() * 60 + startKst.getUTCMinutes();
    const endMinute = endKst.getUTCHours() * 60 + endKst.getUTCMinutes();

    // 정수 및 범위 검증 추가
    if (
      !Number.isInteger(day) ||
      day < 0 ||
      day > 6 ||
      !Number.isInteger(startMinute) ||
      !Number.isInteger(endMinute) ||
      startMinute < 0 ||
      endMinute > 1440 ||
      startMinute >= endMinute
    ) {
      continue;
    }
    const name = event.title;
    if (!name.trim()) continue;

    if (startMinute >= endMinute) {
      console.warn(
        `[ics-converter] 잘못된 시간 범위 무시: ${name} (${startMinute}-${endMinute})`,
      );
      continue;
    }
    // (요일, 시작분) 조합을 키로 중복 제거
    const slotKey = `${day}-${startMinute}`;

    if (!lectureMap.has(name)) {
      lectureMap.set(name, new Map());
    }
    lectureMap.get(name)!.set(slotKey, { day, startMinute, endMinute });
  }

  const lectures = Array.from(lectureMap.entries()).map(([name, slotMap]) => ({
    name,
    times: Array.from(slotMap.values()),
  }));

  return { lectures };
}
