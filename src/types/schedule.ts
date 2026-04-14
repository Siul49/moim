/**
 * 스케줄링 도메인 타입 정의
 *
 * TDD에서 가장 먼저 작성하는 것이 타입(인터페이스)이다.
 * "이 시스템이 어떤 데이터를 다루는가?"를 코드로 선언하면,
 * 테스트와 구현 모두 이 타입을 기준으로 작성할 수 있다.
 *
 * Python의 Pydantic 모델이나 dataclass와 같은 역할.
 */

/** 요일 코드 */
export type DayCode = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

/**
 * 시간 슬롯 — 하루 중 특정 시간대를 나타냄
 *
 * 예: { day: 'MON', startHour: 10, endHour: 15 }
 *     → 월요일 10시~15시
 */
export interface TimeSlot {
  day: DayCode;
  startHour: number; // 0-23
  endHour: number; // 0-23, startHour보다 커야 함
}

/**
 * 참여자의 가용시간 정보
 *
 * 각 참여자가 "나는 이 시간에 가능합니다"라고 입력한 결과.
 * 캘린더 연동, 수동 입력, 이미지 분석 등 모든 입력 방식의
 * 최종 출력이 이 형태로 통일된다.
 */
export interface ParticipantAvailability {
  userId: string;
  available: TimeSlot[];
}

/**
 * 스케줄링 세션 — 호스트가 생성하는 "일정 잡기"
 *
 * PRD 3.1의 "일정 잡기 생성" 결과물.
 */
export interface ScheduleSession {
  id: string;
  title: string;
  hostId: string;
  durationMinutes: number; // 예상 소요시간
  candidateDays: DayCode[]; // 후보 요일
  candidateStartHour: number; // 후보 시간 범위 시작
  candidateEndHour: number; // 후보 시간 범위 끝
  participants: ParticipantAvailability[];
  status: "open" | "confirmed" | "cancelled";
  confirmedSlot?: TimeSlot; // 확정된 시간 (확정 후)
  createdAt: string;
}
