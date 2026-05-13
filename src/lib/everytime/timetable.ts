import { XMLParser } from "fast-xml-parser";
import type {
  EverytimeLecture,
  EverytimeLectureTime,
  EverytimeSession,
  EverytimeTimetable,
} from "@/types/everytime";

// ============================================================
// 에브리타임 시간표 조회 모듈 — 서버 전용
// ============================================================

const BASE_URL = "https://api.everytime.kr";
const SEMESTER_SUGGEST_URL = `${BASE_URL}/find/timetable/semester/suggest`;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => name === "subject" || name === "time",
});

export class EverytimeFetchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EverytimeFetchError";
  }
}

/**
 * 현재 학기의 시간표를 가져온다.
 *
 * 1단계: 현재 학기 ID 조회
 * 2단계: 해당 학기의 강의 목록 조회
 */
export async function fetchCurrentTimetable(
  session: EverytimeSession,
): Promise<EverytimeTimetable> {
  const semesterId = await fetchCurrentSemesterId(session);
  return fetchTimetableBySemester(session, semesterId);
}

async function fetchCurrentSemesterId(
  session: EverytimeSession,
): Promise<string> {
  const response = await fetch(SEMESTER_SUGGEST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token: session.token }),
  });

  if (!response.ok) {
    throw new EverytimeFetchError(`학기 조회 실패 (${response.status})`);
  }

  const xml = await response.text();
  return parseSemesterResponse(xml);
}

async function fetchTimetableBySemester(
  session: EverytimeSession,
  semesterId: string,
): Promise<EverytimeTimetable> {
  const url = `${BASE_URL}/find/timetable/subject/list/semester/id/${semesterId}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token: session.token }),
  });

  if (!response.ok) {
    throw new EverytimeFetchError(`시간표 조회 실패 (${response.status})`);
  }

  const xml = await response.text();
  return parseSubjectListResponse(xml);
}

/** 학기 응답 XML에서 semester id를 파싱한다. */
export function parseSemesterResponse(xml: string): string {
  // 예상 응답:
  // <response status="ok">
  //   <semester id="100" year="2025" semester="1"/>
  // </response>
  const parsed = xmlParser.parse(xml);
  const response = parsed?.response;

  if (response?.["@_status"] !== "ok") {
    throw new EverytimeFetchError("학기 정보를 가져오지 못했습니다.");
  }

  const id = String(response?.semester?.["@_id"] ?? "");
  if (!id) throw new EverytimeFetchError("학기 ID를 찾을 수 없습니다.");

  return id;
}

/** 강의 목록 응답 XML을 파싱한다. */
export function parseSubjectListResponse(xml: string): EverytimeTimetable {
  // 예상 응답:
  // <response status="ok">
  //   <subject id="1">
  //     <name>데이터구조</name>
  //     <time day="1" start="540" end="630"/>
  //     <time day="3" start="540" end="630"/>
  //   </subject>
  // </response>
  const parsed = xmlParser.parse(xml);
  const response = parsed?.response;

  if (response?.["@_status"] !== "ok") {
    throw new EverytimeFetchError("시간표 정보를 가져오지 못했습니다.");
  }

  const subjects: unknown[] = response?.subject ?? [];
  const lectures: EverytimeLecture[] = subjects.map(parseSubject);

  return { lectures };
}

function parseSubject(subject: unknown): EverytimeLecture {
  const s = subject as Record<string, unknown>;
  const name = String(s?.name ?? "");

  const rawTimes = (s?.time ?? []) as unknown[];
  const times: EverytimeLectureTime[] = rawTimes
    .map((t) => {
      const time = t as Record<string, unknown>;
      const day = Number(time?.["@_day"]) as EverytimeLectureTime["day"];
      const startMinute = Number(time?.["@_start"]);
      const endMinute = Number(time?.["@_end"]);
      return { day, startMinute, endMinute };
    })
    .filter(
      (t) =>
        t.day >= 0 &&
        t.day <= 6 &&
        !isNaN(t.startMinute) &&
        !isNaN(t.endMinute) &&
        t.startMinute < t.endMinute,
    );

  return { name, times };
}
