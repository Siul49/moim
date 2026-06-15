import type { DayCode, TimeSlot } from "@/types/schedule";

/**
 * Gemini를 활용한 추천 일정 "자연어 맥락 요약 해설" 생성기.
 *
 * 모임 일정 취합 결과(추천 시간 + 참여자 가용시간)를 입력받아,
 * "왜 이 시간이 좋은지"를 설명하는 친근한 한국어 한 줄 멘트를 만든다.
 * 별도의 SDK 없이 Gemini REST API(generateContent)를 직접 호출한다.
 *
 * API 키가 없거나 호출에 실패하면 예외를 던지지 않고 null을 반환한다.
 * (해설은 부가 기능이므로 실패해도 핵심 결과 화면은 정상 동작해야 한다.)
 */

const DAY_LABELS: Record<DayCode, string> = {
  MON: "월요일",
  TUE: "화요일",
  WED: "수요일",
  THU: "목요일",
  FRI: "금요일",
  SAT: "토요일",
  SUN: "일요일",
};

export interface InsightParticipant {
  name: string;
  available: TimeSlot[];
}

export interface ScheduleInsightInput {
  title: string;
  durationMinutes: number;
  participantCount: number;
  /** 추천 시간(상위 순위순). 보통 commonSlots 전체 또는 상위 일부. */
  recommendedSlots: TimeSlot[];
  participants: InsightParticipant[];
}

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.5-flash";
// Gemini 호출이 길어지면 결과 화면 표시가 지연되므로 짧게 끊는다.
const REQUEST_TIMEOUT_MS = 8000;

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

function formatSlot(slot: TimeSlot): string {
  return `${DAY_LABELS[slot.day] ?? slot.day} ${formatHour(slot.startHour)}-${formatHour(slot.endHour)}`;
}

function buildPrompt(input: ScheduleInsightInput): string {
  const slotLines = input.recommendedSlots
    .slice(0, 3)
    .map((slot, index) => `${index + 1}순위: ${formatSlot(slot)}`)
    .join("\n");

  const participantLines = input.participants
    .map((p) => {
      const slots = p.available.map(formatSlot).join(", ") || "(미입력)";
      return `- ${p.name}: ${slots}`;
    })
    .join("\n");

  return [
    "너는 모임 일정 조율 서비스의 AI 어시스턴트야.",
    "아래 데이터를 바탕으로, 가장 추천하는 시간(1순위)이 왜 좋은지 설명하는",
    "친근하고 직관적인 한국어 한 문장을 만들어줘.",
    "",
    "[작성 규칙]",
    "- 정확히 한 문장, 60자 이내, 존댓말(~입니다/~예요).",
    "- 실제 데이터에 근거할 것. 참여자 수·가용시간 겹침 등 사실만 활용하고 없는 정보(이동 동선, 날씨 등)는 지어내지 말 것.",
    "- 자연스러우면 참여자 이름을 1~2명 언급해도 좋음.",
    "- 따옴표나 마크다운, 이모지 없이 문장만 출력할 것.",
    "",
    `[모임 정보]`,
    `제목: ${input.title}`,
    `예상 소요시간: ${input.durationMinutes}분`,
    `참여자 수: ${input.participantCount}명`,
    "",
    "[추천 시간]",
    slotLines || "(없음)",
    "",
    "[참여자별 가용시간]",
    participantLines || "(없음)",
  ].join("\n");
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
}

/**
 * 추천 일정에 대한 한 줄 AI 해설을 생성한다.
 * 키 미설정·호출 실패 시 null을 반환한다(throw하지 않음).
 */
export async function generateScheduleInsight(
  input: ScheduleInsightInput,
): Promise<string | null> {
  // 대시보드에 붙여넣을 때 끝에 개행/공백이 섞이면 인증이 깨지므로 다듬는다.
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || input.recommendedSlots.length === 0) {
    return null;
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${GEMINI_ENDPOINT}/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: buildPrompt(input) }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 256,
            // gemini-2.5+ 계열은 thinking에 출력 토큰을 소비해 한 줄 해설이 잘린다.
            // 단순 요약이라 추론이 불필요하므로 thinking을 꺼 문장이 온전히 나오게 한다.
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(
        `[gemini] insight 요청 실패 (${response.status}): ${detail.slice(0, 300)}`,
      );
      return null;
    }

    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    return normalizeInsight(text);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[gemini] insight 요청 타임아웃");
    } else {
      console.error("[gemini] insight 생성 중 오류:", error);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** 모델이 따옴표·줄바꿈·접두어를 붙이는 경우를 정리한다. */
function normalizeInsight(text: string | undefined): string | null {
  if (!text) return null;
  const cleaned = text
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}
