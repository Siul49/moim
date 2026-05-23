import { NextRequest, NextResponse } from "next/server";
import { parseTimetableFromIcs } from "@/lib/everytime/ics-converter";
import {
  EverytimeScrapeError,
  fetchTimetableFromUrl,
} from "@/lib/everytime/url-scraper";
import { timetableToFreeSlots } from "@/lib/everytime/converter";
import type { DayCode } from "@/types/schedule";

export const dynamic = "force-dynamic";

/**
 * POST /api/everytime/timetable
 *
 * 에브리타임 시간표를 받아 빈 시간(TimeSlot[])으로 변환한다.
 *
 * 방법 A — 공유 URL (application/json):
 *   { "url": "https://everytime.kr/@XXXX" }
 *
 * 방법 B — ICS 파일 업로드 (multipart/form-data):
 *   file: .ics 파일 (앱 → 시간표 공유 → 캘린더 내보내기)
 *
 * Query: ?days=MON,TUE,WED (선택 — 기본값 월~금)
 *
 * Response:
 *   { "timetable": EverytimeTimetable, "freeSlots": TimeSlot[] }
 */
export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  const candidateDays = parseCandidateDays(req);

  // 방법 A: JSON body에 url 필드
  if (contentType.includes("application/json")) {
    return handleUrlRequest(req, candidateDays);
  }

  // 방법 B: multipart/form-data에 file 필드
  if (contentType.includes("multipart/form-data")) {
    return handleFileRequest(req, candidateDays);
  }

  return NextResponse.json(
    {
      error:
        "Content-Type은 application/json(URL) 또는 multipart/form-data(ICS 파일)여야 합니다.",
    },
    { status: 415 },
  );
}

async function handleUrlRequest(
  req: NextRequest,
  candidateDays: DayCode[] | undefined,
) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "요청 본문이 올바른 JSON이 아닙니다." },
      { status: 400 },
    );
  }

  const url = (body as Record<string, unknown>)?.url;
  if (typeof url !== "string" || !url.trim()) {
    return NextResponse.json(
      { error: "url 필드가 필요합니다." },
      { status: 400 },
    );
  }

  // SSRF 방지: 허용된 도메인·프로토콜만 통과
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.trim());
  } catch {
    return NextResponse.json(
      { error: "유효하지 않은 URL입니다." },
      { status: 400 },
    );
  }
  if (
    parsedUrl.protocol !== "https:" ||
    parsedUrl.hostname !== "everytime.kr"
  ) {
    return NextResponse.json(
      { error: "everytime.kr의 https URL만 허용됩니다." },
      { status: 400 },
    );
  }

  let timetable: Awaited<ReturnType<typeof fetchTimetableFromUrl>>;
  try {
    timetable = await fetchTimetableFromUrl(url.trim());
  } catch (err) {
    if (err instanceof EverytimeScrapeError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error("[everytime.timetable] URL 스크래핑 오류:", err);
    return NextResponse.json(
      { error: "시간표 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }

  try {
    const freeSlots = timetableToFreeSlots(timetable, { candidateDays });
    return NextResponse.json({ timetable, freeSlots });
  } catch (err) {
    console.error("[everytime.timetable] 시간표 변환 오류:", err);
    return NextResponse.json(
      { error: "시간표 변환 중 오류가 발생했습니다." },
      { status: 422 },
    );
  }
}

async function handleFileRequest(
  req: NextRequest,
  candidateDays: DayCode[] | undefined,
) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "파일 업로드 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "file 필드에 ICS 파일을 첨부해주세요." },
      { status: 400 },
    );
  }

  if (!file.name.toLowerCase().endsWith(".ics")) {
    return NextResponse.json(
      { error: ".ics 파일만 지원합니다." },
      { status: 400 },
    );
  }

  if (file.size > 100 * 1024) {
    return NextResponse.json(
      {
        error:
          "파일 크기가 너무 큽니다. 100KB 이하의 ICS 파일을 업로드해주세요.",
      },
      { status: 400 },
    );
  }

  const icsText = await file.text();
  const normalizedIcs = icsText.trim().toUpperCase();
  if (
    !normalizedIcs.includes("BEGIN:VCALENDAR") ||
    !normalizedIcs.includes("END:VCALENDAR")
  ) {
    return NextResponse.json(
      { error: "올바른 ICS 파일 형식이 아닙니다." },
      { status: 400 },
    );
  }

  let timetable: Awaited<ReturnType<typeof parseTimetableFromIcs>>;
  try {
    timetable = parseTimetableFromIcs(icsText);
  } catch (err) {
    console.error("[everytime.timetable] ICS 파싱 오류:", err);
    return NextResponse.json(
      { error: "ICS 파일 파싱 중 오류가 발생했습니다." },
      { status: 422 },
    );
  }

  try {
    const freeSlots = timetableToFreeSlots(timetable, { candidateDays });
    return NextResponse.json({ timetable, freeSlots });
  } catch (err) {
    console.error("[everytime.timetable] 시간표 변환 오류:", err);
    return NextResponse.json(
      { error: "시간표 변환 중 오류가 발생했습니다." },
      { status: 422 },
    );
  }
}

const VALID_DAYS = new Set<DayCode>([
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
]);

function parseCandidateDays(req: NextRequest): DayCode[] | undefined {
  const raw = req.nextUrl.searchParams.get("days");
  if (!raw) return undefined;
  const days = Array.from(
    new Set(
      raw
        .split(",")
        .map((d) => d.trim().toUpperCase() as DayCode)
        .filter((d) => VALID_DAYS.has(d)),
    ),
  );
  return days.length > 0 ? days : undefined;
}
