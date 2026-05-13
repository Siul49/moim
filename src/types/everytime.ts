/** 에브리타임 로그인 자격증명 — 서버 사이드에서만 사용 */
export interface EverytimeCredentials {
  id: string;
  password: string;
}

/** 로그인 성공 후 받는 세션 정보 */
export interface EverytimeSession {
  token: string;
  userIdx: string;
}

/**
 * 강의 시간 (분 단위)
 *
 * 에브리타임 API가 반환하는 start/end 값은 자정 기준 분.
 * 예: startMinute=540 → 09:00, endMinute=630 → 10:30
 */
export interface EverytimeLectureTime {
  /** 0=월, 1=화, 2=수, 3=목, 4=금, 5=토, 6=일 */
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startMinute: number;
  endMinute: number;
}

/** 강의 단건 */
export interface EverytimeLecture {
  name: string;
  times: EverytimeLectureTime[];
}

/** 한 학기의 시간표 전체 */
export interface EverytimeTimetable {
  lectures: EverytimeLecture[];
}
