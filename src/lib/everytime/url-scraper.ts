import { XMLParser } from "fast-xml-parser";
import type {
  EverytimeLectureTime,
  EverytimeTimetable,
} from "@/types/everytime";

// ============================================================
// 에브리타임 공유 URL → 시간표 추출
//
// https://everytime.kr/@XXXX 형식의 공유 링크에서 identifier를 추출하고
// api.everytime.kr/find/timetable/table/friend API를 호출해 XML로 받아온다.
//
// 시간 단위: starttime/endtime 값 × 5 = 자정 기준 분
//   예) 108 × 5 = 540분 = 09:00
// ============================================================

const API_URL = "https://api.everytime.kr/find/timetable/table/friend";
const SHARE_URL_PATTERN = /^https:\/\/everytime\.kr\/@([\w-]+)$/;

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => name === "subject" || name === "data",
});

export class EverytimeScrapeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EverytimeScrapeError";
  }
}

/**
 * 에브리타임 공유 URL에서 시간표를 가져온다.
 *
 * @param url - https://everytime.kr/@XXXX 형식
 */
export async function fetchTimetableFromUrl(
  url: string,
): Promise<EverytimeTimetable> {
  const match = url.match(SHARE_URL_PATTERN);
  if (!match) {
    throw new EverytimeScrapeError(
      "유효하지 않은 에브리타임 URL입니다. (예: https://everytime.kr/@XXXX)",
    );
  }

  const identifier = match[1];

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Origin: "https://everytime.kr",
      Referer: `https://everytime.kr/@${identifier}`,
    },
    body: new URLSearchParams({ identifier }),
  });

  if (!response.ok) {
    throw new EverytimeScrapeError(
      `에브리타임 API 응답 오류 (${response.status})`,
    );
  }

  const xml = await response.text();
  return parseShareResponse(xml);
}

/** 공유 API XML 응답을 EverytimeTimetable로 파싱한다. */
export function parseShareResponse(xml: string): EverytimeTimetable {
  // 응답 형식:
  // <response>
  //   <table year="2026" semester="1" ...>
  //     <subject id="...">
  //       <name value="과목명"/>
  //       <time value="...">
  //         <data day="0" starttime="108" endtime="141" place="..."/>
  //       </time>
  //     </subject>
  //   </table>
  // </response>

  const parsed = xmlParser.parse(xml);
  const table = parsed?.response?.table;

  if (!table) {
    throw new EverytimeScrapeError("시간표 응답을 파싱할 수 없습니다.");
  }

  const subjects: unknown[] = table.subject ?? [];
  const lectures = subjects
    .map((s) => parseSubject(s))
    .filter(
      (l): l is NonNullable<typeof l> => l !== null && l.times.length > 0,
    );

  return { lectures };
}

function parseSubject(
  subject: unknown,
): { name: string; times: EverytimeLectureTime[] } | null {
  const s = subject as Record<string, unknown>;

  const nameNode = s?.name as Record<string, unknown> | undefined;
  const name = String(nameNode?.["@_value"] ?? "");
  if (!name) return null;

  const timeNode = s?.time as Record<string, unknown> | undefined;
  const dataItems: unknown[] = (timeNode?.data as unknown[]) ?? [];

  const times: EverytimeLectureTime[] = dataItems
    .map((d) => parseDataItem(d))
    .filter((t): t is EverytimeLectureTime => t !== null);

  return { name, times };
}

function parseDataItem(d: unknown): EverytimeLectureTime | null {
  const item = d as Record<string, unknown>;

  const day = Number(item["@_day"]);
  // starttime/endtime은 5분 단위 → ×5 하면 자정 기준 분
  const startMinute = Number(item["@_starttime"]) * 5;
  const endMinute = Number(item["@_endtime"]) * 5;

  if (
    isNaN(day) ||
    day < 0 ||
    day > 6 ||
    isNaN(startMinute) ||
    isNaN(endMinute) ||
    startMinute < 0 ||
    startMinute >= endMinute
  ) {
    return null;
  }

  return { day: day as EverytimeLectureTime["day"], startMinute, endMinute };
}
